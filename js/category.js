let TOOLS = [];
let CATEGORIES = [];

// 從 JSON 載入資料
async function loadToolsData() {
  const res = await fetch("/data/tools.json");
  const data = await res.json();
  TOOLS = data.tools;
  CATEGORIES = data.categories;
}

/* 工具卡片 */
function createCard(t) {
  const div = document.createElement("div");
  div.className = "tool-card";
  div.onclick = () => location.href = t.url;

  div.innerHTML = `
    <img src="${t.icon}">
    <div class="tool-title">${t.title}</div>
  `;
  return div;
}

/* 載入分類頁工具 */
async function loadCategory(categoryName) {
  if (TOOLS.length === 0) await loadToolsData();

  const container = document.getElementById("catTools");
  container.innerHTML = "";

  const list = TOOLS.filter(t => t.category === categoryName);

  if (list.length === 0) {
    container.innerHTML = "<p>此分類沒有工具</p>";
    return;
  }

  list.forEach(t => container.appendChild(createCard(t)));
}

/* 取得 Category 描述 */
function getCategoryDesc(cat) {
  const c = CATEGORIES.find(x => x.key === cat);
  return c ? c.desc : "";
}

/* 給首頁與分類頁取用 */
async function getTools() {
  if (TOOLS.length === 0) await loadToolsData();
  return TOOLS;
}

async function getCategories() {
  if (CATEGORIES.length === 0) await loadToolsData();
  return CATEGORIES;
}
