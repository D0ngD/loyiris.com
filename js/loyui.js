/* =====================================
   小洛伊 UI 控制（亮暗模式、自動套用）
===================================== */

(function () {

  // ========== 亮暗模式 ==========
  let theme = localStorage.getItem("theme") || "light";
  applyTheme(theme);

  function applyTheme(mode) {
    if (mode === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem("theme", mode);
  }

  // 全域切換按鈕（如果你有用）
  window.toggleLoyTheme = function () {
    theme = theme === "light" ? "dark" : "light";
    applyTheme(theme);
  };

})();
