(() => {
  "use strict";
  const SPEAKERS = { alex: "Alex", chris: "Chris", ben: "Ben", grace: "Grace", evan: "Evan", dave: "Dave", frank: "Officer Frank" };
  class GameUI {
    constructor({ story, debug = false }) {
      this.story = story; this.debug = debug; this.typingTimer = null; this.autoTimer = null; this.fullText = ""; this.isTyping = false;
      this.toastElement = document.querySelector("#toast");
      this.saves = new window.HarrowSaveManager((message, error) => { console.error(message, error); this.toast(message); });
      this.settings = this.saves.loadSettings();
      this.audio = new window.HarrowAudioManager(this.settings, (message, status) => { document.querySelector("#audio-hint").textContent = message; if (status !== "blocked") console.info(message); });
      this.engine = new window.HarrowGameEngine(story, this.saves, this.audio, {
        dialogue: (entry) => this.renderDialogue(entry), choice: (options) => this.renderChoices(options), visual: (visual) => this.renderVisual(visual),
        state: (state) => this.renderState(state), ending: (name) => this.showEnding(name), error: (error) => this.showFatal(error)
      });
    }
    boot() {
      document.querySelector("#continue-game").disabled = !this.saves.load("auto");
      document.querySelector("#new-game").addEventListener("click", () => this.startNew());
      document.querySelector("#continue-game").addEventListener("click", () => this.loadSlot("auto"));
      document.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => this.openModal(button.dataset.open)));
      document.querySelector("#dialogue-shell").addEventListener("click", () => this.dialogueAction());
      document.querySelector("#dialogue-shell").addEventListener("keydown", (event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); this.dialogueAction(); } });
      document.querySelector("#auto-toggle").addEventListener("click", () => { this.settings.autoplay = !this.settings.autoplay; this.saveSettings(); this.syncSettings(); if (this.settings.autoplay && !this.isTyping) this.queueAuto(); });
      document.querySelector("#title-button").addEventListener("click", () => { if (confirm("返回標題畫面？目前進度已自動儲存。")) this.showTitle(); });
      document.querySelector("#ending-title").addEventListener("click", () => this.showTitle());
      document.querySelectorAll('input[name="text-speed"]').forEach((input) => input.addEventListener("change", () => { this.settings.textSpeed = input.value; this.saveSettings(); }));
      document.querySelector("#bgm-volume").addEventListener("input", (event) => { this.settings.bgmVolume = Number(event.target.value); this.saveSettings(); this.syncSettings(); });
      document.querySelector("#se-volume").addEventListener("input", (event) => { this.settings.seVolume = Number(event.target.value); this.saveSettings(); this.syncSettings(); });
      document.querySelector("#bgm-enabled").addEventListener("change", (event) => { this.settings.bgmEnabled = event.target.checked; this.saveSettings(); this.syncSettings(); });
      this.syncSettings(); this.renderSlots();
      if (this.debug) document.querySelector("#debug-panel").hidden = false;
      window.addEventListener("error", (event) => console.error("Web game error", event.error || event.message));
    }
    startNew() {
      if (this.saves.load("auto") && !confirm("開始新遊戲會覆蓋自動存檔，確定繼續？")) return;
      this.audio.unlock(); this.enterPlay(); this.engine.newGame();
    }
    enterPlay() { document.querySelector("#title-screen").hidden = true; document.querySelector("#play-view").hidden = false; }
    showTitle() { clearTimeout(this.autoTimer); this.audio.applyMode("silent"); document.querySelector("#play-view").hidden = true; document.querySelector("#title-screen").hidden = false; document.querySelector("#continue-game").disabled = !this.saves.load("auto"); document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close()); }
    renderDialogue(entry) {
      clearTimeout(this.autoTimer); document.querySelector("#choices").hidden = true;
      const shell = document.querySelector("#dialogue-shell"); shell.hidden = false; shell.classList.toggle("centered", entry.centered);
      document.querySelector("#speaker").textContent = SPEAKERS[entry.speaker] || entry.speaker || "";
      this.fullText = entry.text; const output = document.querySelector("#dialogue"); output.textContent = ""; document.querySelector("#advance-mark").classList.remove("ready");
      clearInterval(this.typingTimer); const delays = { slow: 62, normal: 34, fast: 14, instant: 0 }; const delay = delays[this.settings.textSpeed] ?? 34;
      if (!delay) { output.textContent = this.fullText; this.isTyping = false; this.onTypingComplete(); return; }
      this.isTyping = true; const units = Array.from(this.fullText); let index = 0;
      this.typingTimer = setInterval(() => { index += 1; output.textContent = units.slice(0, index).join(""); if (index >= units.length) { clearInterval(this.typingTimer); this.isTyping = false; this.onTypingComplete(); } }, delay);
    }
    dialogueAction() { this.audio.unlock(); if (this.isTyping) { clearInterval(this.typingTimer); document.querySelector("#dialogue").textContent = this.fullText; this.isTyping = false; this.onTypingComplete(); } else { clearTimeout(this.autoTimer); this.engine.advance(); } }
    onTypingComplete() { document.querySelector("#advance-mark").classList.add("ready"); if (this.settings.autoplay) this.queueAuto(); }
    queueAuto() { clearTimeout(this.autoTimer); this.autoTimer = setTimeout(() => { if (!this.isTyping && this.settings.autoplay) this.engine.advance(); }, 1500); }
    renderChoices(options) {
      clearTimeout(this.autoTimer); const choices = document.querySelector("#choices"); choices.innerHTML = ""; choices.hidden = false; document.querySelector("#dialogue-shell").hidden = true;
      options.forEach((option, index) => { const button = document.createElement("button"); button.type = "button"; button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span>${option.text}`; button.addEventListener("click", () => { this.audio.unlock(); choices.hidden = true; this.engine.choose(option); }); choices.append(button); });
      choices.querySelector("button")?.focus();
    }
    renderVisual(visual) {
      const scene = document.querySelector("#scene-layer"); scene.style.backgroundImage = `url("${visual.scene.path}")`; scene.dataset.scene = visual.scene.name;
      const portraits = document.querySelector("#portraits"); portraits.innerHTML = "";
      visual.portraits.forEach((asset, index) => { const img = document.createElement("img"); img.src = asset.path; img.alt = ""; img.className = `portrait ${asset.position || (index ? "right" : "left")}`; img.addEventListener("error", () => img.remove()); portraits.append(img); });
      if (visual.scene.missing) this.toast(`找不到 Asset：${visual.scene.name}，已使用預留圖片。`);
    }
    renderState(state) {
      document.querySelector("#hud-day").textContent = `DAY ${state.game_day}・${state.game_period}`; document.querySelector("#hud-time").textContent = state.game_time;
      document.querySelector("#status-content").innerHTML = `<div class="status-grid"><div><b>線索</b><strong>${state.clue}</strong></div><div><b>危險</b><strong>${state.threat}</strong></div><div><b>Ben</b><strong>${state.ben_affection}</strong></div><div><b>Dave</b><strong>${state.dave_affection}</strong></div><div><b>Evan</b><strong>${state.evan_affection}</strong></div><div><b>Chris</b><strong>${state.chris_affection}</strong></div></div><p>目前路線：${state.locked_route || "尚未決定"}</p><p>人格傾向：${state.personality_result || "仍在形成"}</p><p>真相碎片：${[1,2,3,4,5,6].filter((n) => state[`fragment_${n}_${["newspaper","knock_pattern","bleach_trace","letter_ash","tenant_gap","basement_key"][n-1]}`]).length} / 6</p>`;
      if (this.debug) document.querySelector("#debug-panel").textContent = `DEBUG｜${state.current_scene}\nDay ${state.game_day} ${state.game_time}\nFlags: ${Object.entries(state).filter(([key,value]) => typeof value === "boolean" && value).map(([key]) => key).join(", ")}\nAffection: B${state.ben_affection} D${state.dave_affection} E${state.evan_affection} C${state.chris_affection}\nInventory: ${(state.inventory || []).join(", ") || "—"}`;
    }
    openModal(id) { this.renderSlots(); const modal = document.getElementById(id); if (modal && !modal.open) modal.showModal(); }
    renderSlots() {
      document.querySelectorAll(".slot-list").forEach((container) => { const mode = container.dataset.mode; container.innerHTML = ""; this.saves.list().forEach(({ slot, record }) => {
        const row = document.createElement("div"); row.className = "save-slot"; const title = slot === "auto" ? "Auto Save" : `Save ${slot}`; const state = record?.snapshot?.state;
        row.innerHTML = `<div><b>${title}</b><span>${record ? `${new Date(record.savedAt).toLocaleString("zh-TW")}<br>Day ${state.game_day}・${state.game_period} ${state.game_time}` : "空白"}</span></div><div class="slot-actions"></div>`;
        const actions = row.querySelector(".slot-actions");
        if (mode === "save" && slot !== "auto") { const save = document.createElement("button"); save.type = "button"; save.textContent = "儲存"; save.addEventListener("click", () => this.saveSlot(slot)); actions.append(save); }
        if (mode === "load") { const load = document.createElement("button"); load.type = "button"; load.textContent = "讀取"; load.disabled = !record; load.addEventListener("click", () => this.loadSlot(slot)); actions.append(load); }
        if (record) { const remove = document.createElement("button"); remove.type = "button"; remove.className = "danger"; remove.textContent = "刪除"; remove.addEventListener("click", () => { if (confirm(`刪除 ${title}？`)) { this.saves.remove(slot); this.renderSlots(); } }); actions.append(remove); }
        container.append(row);
      }); });
    }
    saveSlot(slot) { if (!this.engine.stack.length) { this.toast("請先開始或讀取遊戲。"); return; } this.saves.save(slot, this.engine.serialize(), `Day ${this.engine.state.game_day}`); this.toast(`已儲存至 Save ${slot}`); this.renderSlots(); }
    loadSlot(slot) { const record = this.saves.load(slot); if (!record) { this.toast("這個存檔槽是空的。"); return; } try { this.audio.unlock(); this.enterPlay(); this.engine.load(record.snapshot); document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close()); this.toast("已讀取存檔"); } catch (error) { this.showFatal(error); } }
    syncSettings() {
      document.querySelectorAll('input[name="text-speed"]').forEach((input) => { input.checked = input.value === this.settings.textSpeed; });
      document.querySelector("#bgm-volume").value = this.settings.bgmVolume; document.querySelector("#bgm-output").value = `${Math.round(this.settings.bgmVolume * 100)}%`;
      document.querySelector("#se-volume").value = this.settings.seVolume; document.querySelector("#se-output").value = `${Math.round(this.settings.seVolume * 100)}%`;
      document.querySelector("#bgm-enabled").checked = this.settings.bgmEnabled; const auto = document.querySelector("#auto-toggle"); auto.setAttribute("aria-pressed", String(this.settings.autoplay)); auto.classList.toggle("active", this.settings.autoplay); this.audio.update(this.settings);
    }
    saveSettings() { this.saves.saveSettings(this.settings); }
    showEnding(name) { document.querySelector("#ending-name").textContent = name; this.saves.save("auto", this.engine.serialize(), name); document.querySelector("#ending-modal").showModal(); }
    toast(message) { this.toastElement.textContent = message; this.toastElement.classList.add("show"); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toastElement.classList.remove("show"), 3200); }
    showFatal(error) { console.error(error); document.querySelector("#fatal-message").textContent = error?.message || String(error); document.querySelector("#fatal-error").hidden = false; }
  }
  window.HarrowGameUI = GameUI;
})();
