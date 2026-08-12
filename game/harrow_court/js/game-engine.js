(() => {
  "use strict";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  class GameEngine {
    constructor(story, saveManager, audioManager, handlers = {}) {
      this.story = story; this.saveManager = saveManager; this.audio = audioManager; this.handlers = handlers;
      this.state = {}; this.stack = []; this.visual = { scene: "", portraits: [] }; this.history = []; this.waiting = false; this.currentEvent = null;
    }
    newGame() {
      this.state = clone(this.story.initialState); this.state.game_day = 1; this.state.game_time = "18:35"; this.state.game_period = "黃昏";
      this.stack = [{ blockId: this.story.labels.start, index: 0, kind: "label", label: "start" }];
      this.visual = { scene: "bg lobby evening", portraits: [] }; this.history = []; this.waiting = false; this.currentEvent = null;
      this.emit("state", this.state); this.applyScene(this.visual.scene); this.process();
    }
    serialize() { return { formatVersion: 1, state: clone(this.state), stack: clone(this.stack), visual: clone(this.visual), history: clone(this.history.slice(-300)), currentEvent: clone(this.currentEvent) }; }
    load(snapshot) {
      if (!snapshot?.state || !Array.isArray(snapshot.stack)) throw new Error("存檔缺少必要資料");
      for (const frame of snapshot.stack) if (!this.story.blocks[frame.blockId]) throw new Error(`存檔指向不存在的劇情區塊：${frame.blockId}`);
      this.state = clone(snapshot.state); this.stack = clone(snapshot.stack); this.visual = clone(snapshot.visual || { scene: "bg lobby evening", portraits: [] }); this.history = clone(snapshot.history || []); this.currentEvent = clone(snapshot.currentEvent || null); this.waiting = !!this.currentEvent;
      this.emit("state", this.state); this.emit("visual", this.getVisual()); this.applyMusicFor(this.visual.scene);
      if (this.currentEvent) this.emit(this.currentEvent.type, this.currentEvent.payload); else this.process();
    }
    advance() { if (!this.waiting) return; this.waiting = false; this.currentEvent = null; this.process(); }
    choose(option) {
      if (!this.waiting || !this.story.blocks[option.block]) return;
      this.waiting = false; this.currentEvent = null; this.stack.push({ blockId: option.block, index: 0, kind: "block" }); this.autoSave(); this.process();
    }
    process() {
      try {
        let guard = 0;
        while (this.stack.length && guard++ < 10000) {
          const frame = this.stack[this.stack.length - 1]; const block = this.story.blocks[frame.blockId];
          if (!block) throw new Error(`找不到劇情區塊：${frame.blockId}`);
          if (frame.index >= block.length) { this.stack.pop(); continue; }
          const node = block[frame.index++];
          if (node.type === "action") { this.execute(node.code); this.emit("state", this.state); continue; }
          if (node.type === "scene") { this.applyScene(node.name); continue; }
          if (node.type === "show") { this.showAsset(node.name, node.position); continue; }
          if (node.type === "hide") { this.hideAsset(node.name); continue; }
          if (node.type === "conditional") { const branch = node.branches.find((item) => item.condition === null || this.evaluate(item.condition)); if (branch) this.stack.push({ blockId: branch.block, index: 0, kind: "block" }); continue; }
          if (node.type === "call") { this.pushLabel(node.label); continue; }
          if (node.type === "jump") { this.returnFromLabel(); this.pushLabel(node.label); continue; }
          if (node.type === "return") { this.returnFromLabel(); continue; }
          if (node.type === "screen") { if (node.name === "ending_summary") { this.waiting = true; this.currentEvent = { type: "ending", payload: this.state.ending_name || "故事完結" }; this.autoSave(); this.emit("ending", this.currentEvent.payload); return; } continue; }
          if (node.type === "dialogue") {
            const entry = { speaker: node.speaker, text: this.interpolate(node.text), centered: !!node.centered };
            this.history.push(entry); this.waiting = true; this.currentEvent = { type: "dialogue", payload: entry }; this.autoSave(); this.emit("dialogue", entry); return;
          }
          if (node.type === "choice") { this.waiting = true; this.currentEvent = { type: "choice", payload: node.options }; this.autoSave(); this.emit("choice", node.options); return; }
          if (node.type === "end") { this.waiting = true; this.currentEvent = { type: "ending", payload: this.state.ending_name || "故事完結" }; this.emit("ending", this.currentEvent.payload); return; }
          throw new Error(`不支援的劇情節點：${node.type}`);
        }
        if (guard >= 10000) throw new Error("劇情執行超過安全上限，可能存在無限迴圈");
      } catch (error) { this.fail(error); }
    }
    pushLabel(label) { const blockId = this.story.labels[label]; if (!blockId) throw new Error(`找不到 Branch / Label：${label}`); this.stack.push({ blockId, index: 0, kind: "label", label }); }
    returnFromLabel() { while (this.stack.length) { const frame = this.stack.pop(); if (frame.kind === "label") return; } }
    evaluate(expression) {
      const javascript = expression.replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false").replace(/\band\b/g, "&&").replace(/\bor\b/g, "||").replace(/\bnot\b/g, "!");
      return Function("state", `with(state){return Boolean(${javascript})}`)(this.state);
    }
    value(expression) {
      const javascript = expression.replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false").replace(/\bNone\b/g, "null").replace(/\band\b/g, "&&").replace(/\bor\b/g, "||").replace(/\bnot\b/g, "!").replace(/\bmax\s*\(/g, "Math.max(").replace(/\bmin\s*\(/g, "Math.min(");
      return Function("state", `with(state){return (${javascript})}`)(this.state);
    }
    execute(code) {
      if (code.startsWith("renpy.save(")) { this.autoSave(); return; }
      const clock = code.match(/^set_game_clock\((\d+),\s*("(?:[^"\\]|\\.)*"),\s*("(?:[^"\\]|\\.)*")\)$/);
      if (clock) { this.state.game_day = Number(clock[1]); this.state.chapter = Number(clock[1]); this.state.game_time = JSON.parse(clock[2]); this.state.game_period = JSON.parse(clock[3]); return; }
      const augmented = code.match(/^([a-zA-Z_]\w*)\s*([+\-])=\s*(.+)$/);
      if (augmented) { const [, name, operator, raw] = augmented; const amount = this.value(raw); this.state[name] = (this.state[name] || 0) + (operator === "+" ? amount : -amount); return; }
      const assignment = code.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignment) {
        const [, name, raw] = assignment; this.state[name] = this.value(raw);
        if (name === "ending_name" && this.state[name] && !this.state.endings.includes(this.state[name])) this.state.endings.push(this.state[name]);
        return;
      }
      throw new Error(`無法執行的狀態指令：${code}`);
    }
    interpolate(text) { return String(text).replace(/\[([a-zA-Z_]\w*)\]/g, (_, key) => key in this.state ? String(this.state[key]) : `[${key}]`).replace(/\{\/?(?:i|b|size[^}]*)\}/g, ""); }
    applyScene(name) { this.visual.scene = name; this.visual.portraits = []; this.state.current_scene = name; this.emit("visual", this.getVisual()); this.applyMusicFor(name); }
    showAsset(name, position = "center") { if (name.startsWith("char ")) { const character = name.split(" ")[1]; this.visual.portraits = this.visual.portraits.filter((item) => item.name.split(" ")[1] !== character); } this.visual.portraits.push({ name, position }); this.emit("visual", this.getVisual()); }
    hideAsset(name) { this.visual.portraits = this.visual.portraits.filter((item) => !item.name.startsWith(name)); this.emit("visual", this.getVisual()); }
    asset(name) { const found = this.story.assets[name]; return found ? { ...found, name } : { name, path: "../assets/images/ui/ui_gallery_locked.png", musicMode: "normal", missing: true }; }
    getVisual() { return { scene: this.asset(this.visual.scene), portraits: this.visual.portraits.map((item) => ({ ...this.asset(item.name), position: item.position })) }; }
    applyMusicFor(name) { this.audio.applyMode(this.asset(name).musicMode); }
    autoSave() { if (this.state && this.stack.length) this.saveManager.save("auto", this.serialize(), `Day ${this.state.game_day}・${this.state.game_period}`); }
    emit(name, payload) { this.handlers[name]?.(payload); }
    fail(error) { console.error(error); this.emit("error", error); }
  }
  window.HarrowGameEngine = GameEngine;
})();
