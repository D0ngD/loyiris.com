function loadHeader(category = "", toolName = "") {
  fetch("/header.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("header").innerHTML = html;

      const nameSpan = document.getElementById("toolName");

      // 麵包屑 HTML
      let titleHTML = `<a href="https://loyiris.com/tools" class="crumb">Roy Dreambox</a>`;

      if (category) {
        titleHTML += ` ｜ <a href="/categories/category-template.html?cat=${mapCategoryId(category)}" class="crumb">${category}</a>`;
      }

      if (toolName) {
        titleHTML += ` ｜ <span class="crumb-current">${toolName}</span>`;
      }

      nameSpan.innerHTML = titleHTML;

      // 深色模式套用
      if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
      }
      
      applySEOMeta(category, toolName);
      applyBreadcrumbJSON(category, toolName);
    });
}

// 將分類中文名稱轉換成網址用 ID
function mapCategoryId(name) {
  const map = {
    "文本工具": "text",
    "語言工具": "language",
    "計算工具": "count",
    "換算工具": "convert",
    "編碼解碼工具": "codec",
    "生活工具": "life"
  };
  return map[name] || "";
}

// =======================
// SEO Meta 自動生成
// =======================
function applySEOMeta(category, toolName) {
  const DOMAIN = "https://loyiris.com";

  // 自動 description
  let desc = "";
  if (toolName) {
    desc = `${toolName}：在 Roy Dreambox 中免費線上使用的工具，支援即時操作、免安裝、手機可用。`;
  } else if (category) {
    desc = `${category}：Roy Dreambox 的工具分類，提供多項線上工具可使用。`;
  } else {
    desc = "Roy Dreambox：免費、快速的線上小工具集合。";
  }

  const head = document.querySelector("head");

  // description
  const metaDesc = document.createElement("meta");
  metaDesc.name = "description";
  metaDesc.content = desc;
  head.appendChild(metaDesc);

  // keywords
  const metaKey = document.createElement("meta");
  metaKey.name = "keywords";
  metaKey.content = `${toolName || category || "工具"}, Roy Dreambox, 線上工具, 免費工具`;
  head.appendChild(metaKey);

  // --- Open Graph ---
  const og = (prop, content) => {
    const m = document.createElement("meta");
    m.setAttribute("property", prop);
    m.content = content;
    head.appendChild(m);
  };

  og("og:title", toolName ? `${toolName}｜Roy Dreambox` : "Roy Dreambox");
  og("og:description", desc);
  og("og:type", "website");
  og("og:url", location.href);
  og("og:image", `${DOMAIN}/img/og-default.png`);
}

// =======================
// Breadcrumb 結構化資料
// =======================
function applyBreadcrumbJSON(category, toolName) {
  const DOMAIN = "https://loyiris.com";

  const list = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Roy Toolbox",
      "item": `${DOMAIN}/`
    }
  ];

  if (category) {
    list.push({
      "@type": "ListItem",
      "position": 2,
      "name": category,
      "item": `${DOMAIN}/categories/category-template.html?cat=${mapCategoryId(category)}`
    });
  }

  if (toolName) {
    list.push({
      "@type": "ListItem",
      "position": category ? 3 : 2,
      "name": toolName,
      "item": location.href
    });
  }

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": list
  });

  document.head.appendChild(script);
}
