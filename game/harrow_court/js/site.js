(() => {
  "use strict";
  const data = window.HARROW_WEBSITE;
  const list = document.querySelector("#character-list");
  const gallery = document.querySelector("#gallery-strip");
  const fallback = "assets/images/ui/ui_gallery_locked.png";

  function safeImage(img) {
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = "true";
      img.src = fallback;
      img.alt += "（素材待補）";
    });
  }

  data.characters.forEach((character, index) => {
    const article = document.createElement("article");
    article.className = "character-card reveal";
    article.innerHTML = `
      <div class="character-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</div>
      <div class="portrait-wrap"><img src="${character.portrait}" alt="${character.name} 角色立繪" loading="lazy"></div>
      <div class="character-copy">
        <p class="character-role">${character.role}</p><h3>${character.name}</h3>
        <p class="character-summary">${character.summary}</p>
        <button class="details-toggle" type="button" aria-expanded="false">More <span aria-hidden="true">＋</span></button>
        <div class="character-details" inert>
          <p>${character.description}</p>
          <div class="showcase"><img src="${character.showcase.cg}" alt="${character.name} 代表劇情 CG" loading="lazy"><blockquote>${character.showcase.quote}</blockquote><p>${character.showcase.scene}</p></div>
        </div>
      </div>`;
    article.querySelector(".details-toggle").addEventListener("click", (event) => {
      const button = event.currentTarget;
      const details = article.querySelector(".character-details");
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      button.querySelector("span").textContent = open ? "＋" : "−";
      article.classList.toggle("is-open", !open);
      details.inert = open;
    });
    article.querySelectorAll("img").forEach(safeImage);
    list.append(article);

    const figure = document.createElement("figure");
    figure.className = "gallery-item reveal";
    figure.innerHTML = `<img src="${character.showcase.cg}" alt="${character.name} 劇情片段" loading="lazy"><figcaption><span>${character.name}</span>${character.showcase.quote}</figcaption>`;
    safeImage(figure.querySelector("img"));
    gallery.append(figure);
  });

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");
  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
  });
  nav.addEventListener("click", () => { navToggle.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open"); });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
})();
