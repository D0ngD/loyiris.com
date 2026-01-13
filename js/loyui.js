(function () {

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

  window.toggleLoyTheme = function () {
    theme = theme === "light" ? "dark" : "light";
    applyTheme(theme);
  };

})();
