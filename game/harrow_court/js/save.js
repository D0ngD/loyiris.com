(() => {
  "use strict";
  const PREFIX = "harrow-court-web-v1";
  class SaveManager {
    constructor(onError = console.error) { this.onError = onError; }
    key(slot) { return `${PREFIX}:save:${slot}`; }
    save(slot, snapshot, label = "") {
      const record = { formatVersion: 1, savedAt: new Date().toISOString(), label, snapshot };
      try { localStorage.setItem(this.key(slot), JSON.stringify(record)); return record; }
      catch (error) { this.onError("無法寫入瀏覽器存檔。可能是私人瀏覽模式或儲存空間已滿。", error); return null; }
    }
    load(slot) {
      try {
        const raw = localStorage.getItem(this.key(slot));
        if (!raw) return null;
        const record = JSON.parse(raw);
        if (record.formatVersion !== 1 || !record.snapshot?.state || !Array.isArray(record.snapshot?.stack)) throw new Error("Invalid save format");
        return record;
      } catch (error) { this.onError(`存檔「${slot}」格式錯誤。`, error); return null; }
    }
    remove(slot) { try { localStorage.removeItem(this.key(slot)); return true; } catch (error) { this.onError("無法刪除存檔。", error); return false; } }
    list() { return ["auto", "1", "2", "3"].map((slot) => ({ slot, record: this.load(slot) })); }
    saveSettings(settings) { try { localStorage.setItem(`${PREFIX}:settings`, JSON.stringify(settings)); } catch (error) { this.onError("無法儲存設定。", error); } }
    loadSettings() {
      const defaults = { textSpeed: "normal", bgmVolume: .7, seVolume: .7, bgmEnabled: true, autoplay: false };
      try { return { ...defaults, ...JSON.parse(localStorage.getItem(`${PREFIX}:settings`) || "{}") }; }
      catch (error) { this.onError("設定格式錯誤，已恢復預設值。", error); return defaults; }
    }
  }
  window.HarrowSaveManager = SaveManager;
})();
