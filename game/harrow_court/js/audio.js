(() => {
  "use strict";
  class AudioManager {
    constructor(settings, onStatus = () => {}) {
      this.settings = settings; this.onStatus = onStatus; this.mode = "normal"; this.unlocked = false; this.fadeTimer = null;
      this.bgm = new Audio("../assets/audio/bgm/main-theme.mp3"); this.bgm.loop = true; this.bgm.preload = "none"; this.bgm.volume = settings.bgmVolume;
      this.bgm.addEventListener("error", () => this.onStatus("背景音樂尚未放入；遊戲可正常進行。", "missing"), { once: true });
    }
    unlock() { this.unlocked = true; this.applyMode(this.mode, true); }
    update(settings) { this.settings = settings; if (!settings.bgmEnabled) this.fadeTo(0, true); else this.applyMode(this.mode, true); }
    applyMode(mode, immediate = false) { this.mode = mode || "normal"; const shouldPlay = this.unlocked && this.settings.bgmEnabled && this.mode === "normal"; if (shouldPlay) { this.bgm.play().then(() => this.fadeTo(this.settings.bgmVolume, false, immediate)).catch(() => this.onStatus("點擊遊戲畫面後即可播放背景音樂。", "blocked")); } else { this.fadeTo(0, true, immediate); } }
    fadeTo(target, pauseAfter = false, immediate = false) {
      clearInterval(this.fadeTimer); target = Math.max(0, Math.min(1, target));
      if (immediate) { this.bgm.volume = target; if (pauseAfter && target === 0) this.bgm.pause(); return; }
      const start = this.bgm.volume, steps = 14; let step = 0;
      this.fadeTimer = setInterval(() => { step += 1; this.bgm.volume = Math.max(0, Math.min(1, start + (target - start) * (step / steps))); if (step >= steps) { clearInterval(this.fadeTimer); if (pauseAfter && target === 0) this.bgm.pause(); } }, 60);
    }
  }
  window.HarrowAudioManager = AudioManager;
})();
