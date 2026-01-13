(function () {
  const container = document.getElementById("global-buttons");

  container.innerHTML = `
    <div class="global-btn" id="btn-top" title="回到最上方">▲</div>
    <div class="global-btn" id="btn-theme" title="明亮 / 暗黑模式">●</div>
  `;

  // 回到最上方
  document.getElementById("btn-top").onclick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 深色模式切換
  let theme = localStorage.getItem("theme") || "light";
  applyTheme(theme);

  document.getElementById("btn-theme").onclick = () => {
    theme = theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  };

  function applyTheme(mode) {
    if (mode === "dark") document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  };

})();
