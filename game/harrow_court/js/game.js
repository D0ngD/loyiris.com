(() => {
  "use strict";
  const DEBUG = false;
  if (!window.HARROW_STORY) {
    document.querySelector("#fatal-error").hidden = false;
    document.querySelector("#fatal-message").textContent = "story-data.js 不存在或格式不正確。";
    return;
  }
  const ui = new window.HarrowGameUI({ story: window.HARROW_STORY, debug: DEBUG || new URLSearchParams(location.search).get("debug") === "1" });
  ui.boot();
})();
