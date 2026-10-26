const CATS = ["Двигатель", "Тормоза", "Фильтры", "Подвеска", "Электрика", "Сервис"];
const ITEMS = [
  ["Тормозные колодки", "Тормоза"],
  ["Тормозной диск", "Тормоза"],
  ["Масляный фильтр", "Фильтры"],
  ["Воздушный фильтр", "Фильтры"],
  ["Свечи зажигания", "Двигатель"],
  ["Комплект ремня ГРМ", "Двигатель"],
  ["Амортизатор", "Подвеска"],
  ["Рычаг подвески", "Подвеска"],
  ["Аккумулятор", "Электрика"],
  ["Генератор", "Электрика"],
  ["Диагностика", "Сервис"],
  ["Замена масла", "Сервис"]
];

const ICON = `
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
    <circle cx="24" cy="24" r="16"/>
    <circle cx="24" cy="24" r="5"/>
    <path d="M24 8v6M24 34v6M8 24h6M34 24h6"/>
  </svg>
`;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let currentCat = "Все";
let currentTerm = "";
let editing = false;
let saved = {};

const KEY = "mph-ru-v1";

function setDocTitle() {
  document.title = "MachineryPartsHub";
}

function initEditableText() {
  const editableTargets = $$('h1, .lead, .hint, .eyebrow, .strip div, h2, p, .pillars div, a.btn, dt, dd, footer h4, footer p, footer li[data-f], footer li a[href="#"], .copy > span');
  editableTargets.forEach((element, index) => {
    element.dataset.e = String(index);
  });

  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch (error) {
    saved = {};
  }

  Object.entries(saved).forEach(([index, html]) => {
    if (editableTargets[Number(index)]) {
      editableTargets[Number(index)].innerHTML = html;
    }
  });

  document.getElementById("yr").textContent = new Date().getFullYear();

  if (Object.keys(saved).length) {
    document.getElementById("rst").hidden = false;
  }

  document.getElementById("edit").addEventListener("click", (event) => {
    editing = !editing;
    event.currentTarget.setAttribute("aria-pressed", String(editing));
    event.currentTarget.textContent = editing ? "✓ Готово" : "✎ Редактировать текст";
    document.body.classList.toggle("editing", editing);
  });

  document.addEventListener("input", (event) => {
    const target = event.target.closest && event.target.closest("[data-e]");
    if (!target) return;

    saved[target.dataset.e] = target.innerHTML;

    if (target.dataset.f) {
      $$('[data-f="' + target.dataset.f + '"]').forEach((node) => {
        if (node !== target) {
          node.innerHTML = target.innerHTML;
          saved[node.dataset.e] = node.innerHTML;
        }
      });
    }

    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch (error) {
      // ignore localStorage quota issues in demo mode
    }

    document.getElementById("rst").hidden = false;
  });

  document.addEventListener("keydown", (event) => {
    if (editing && event.key === "Enter" && event.target.closest && event.target.closest("[data-e]")) {
      event.preventDefault();
    }
  });

  document.addEventListener("click", (event) => {
    if (editing && event.target.closest("a[data-e], a.btn")) {
      event.preventDefault();
    }
  }, true);

  document.getElementById("rst").addEventListener("click", () => {
    try {
      localStorage.removeItem(KEY);
    } catch (error) {
      // ignore storage failure
    }
    location.reload();
  });
}

function renderCatalog() {
  const filtered = ITEMS.filter(([name, category]) => {
    const matchesCategory = currentCat === "Все" || category === currentCat;
    const matchesTerm = name.toLowerCase().includes(currentTerm);
    return matchesCategory && matchesTerm;
  });

  document.getElementById("cards").innerHTML = filtered
    .map(([name, category]) => `
      <article class="card">
        <div class="photo-block">${ICON}</div>
        <div class="body">
          <small>${category}</small>
          <h3>${name}</h3>
        </div>
        <button type="button" data-req="${name}">Запросить →</button>
      </article>
    `)
    .join("");

  document.getElementById("empty").style.display = filtered.length ? "none" : "block";
  $$(".chip").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.c === currentCat));
  });
}

function renderCategoryChips() {
  const chips = ["Все", ...CATS];
  document.getElementById("chips").innerHTML = chips
    .map(
      (category) => `
        <button class="chip" type="button" data-c="${category}" aria-pressed="${category === "Все"}">
          ${category}
        </button>
      `
    )
    .join("");

  document.getElementById("fcats").innerHTML = CATS.map(
    (category) => `<li><a href="#catalog" data-c="${category}">${category}</a></li>`
  ).join("");
}

function handleCatalogClicks(event) {
  const clickedChip = event.target.closest("[data-c]");
  if (clickedChip) {
    const category = clickedChip.dataset.c;
    currentCat = category;
    renderCatalog();
  }

  const requestButton = event.target.closest("[data-req]");
  if (requestButton) {
    location.hash = "#request";
    resetForm();
    const field = document.forms.rf.elements.part;
    field.value = requestButton.dataset.req;
    field.focus({ preventScroll: true });
  }

  if (event.target.closest("nav a")) {
    closeMenu();
  }
}

function closeMenu() {
  const nav = document.getElementById("nav");
  nav.classList.remove("open");
  document.getElementById("menu").setAttribute("aria-expanded", "false");
}

function initMenu() {
  const nav = document.getElementById("nav");
  document.getElementById("menu").addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    document.getElementById("menu").setAttribute("aria-expanded", String(isOpen));
  });
}

function initSearch() {
  document.getElementById("hsearch").addEventListener("submit", (event) => {
    event.preventDefault();
    currentTerm = document.getElementById("q").value.trim().toLowerCase();
    currentCat = "Все";
    renderCatalog();
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("q").addEventListener("input", (event) => {
    currentTerm = event.target.value.trim().toLowerCase();
    renderCatalog();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !editing && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      event.preventDefault();
      document.getElementById("q").focus();
    }
  });
}

function initNavigationActiveState() {
  const sections = ["about", "catalog", "request", "contact"];
  window.addEventListener(
    "scroll",
    () => {
      let active = "";
      sections.forEach((section) => {
        const element = document.getElementById(section);
        if (element && element.getBoundingClientRect().top < 140) {
          active = section;
        }
      });

      $$("nav a").forEach((link) => {
        link.classList.toggle("on", link.getAttribute("href") === `#${active}`);
      });
    },
    { passive: true }
  );
}

function resetForm() {
  document.getElementById("ok").style.display = "none";
  document.getElementById("rf").style.display = "grid";
}

function initForm() {
  const form = document.getElementById("rf");
  const again = document.getElementById("again");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let firstInvalid = null;
    const rules = {
      name: (value) => value.trim().length >= 2 || "Введите имя.",
      phone: (value) => /^\+?[\d\s()-]{7,}$/.test(value.trim()) || "Введите корректный номер телефона.",
      vehicle: (value) => value.trim().length >= 3 || "Укажите марку, модель и год.",
      part: (value) => value.trim().length >= 3 || "Укажите нужную запчасть или услугу."
    };

    Object.entries(rules).forEach(([key, validator]) => {
      const input = form.elements[key];
      const error = input.parentElement.querySelector(".err");
      const result = validator(input.value);

      if (result !== true) {
        error.textContent = result;
        input.setAttribute("aria-invalid", "true");
        firstInvalid = firstInvalid || input;
      } else {
        error.textContent = "";
        input.removeAttribute("aria-invalid");
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    document.getElementById("okname").textContent = form.elements.name.value.trim();
    form.style.display = "none";
    document.getElementById("ok").style.display = "block";
    form.reset();
  });

  again.addEventListener("click", resetForm);
}

function initContactLinks() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-link]");
    if (!link || editing) return;

    const key = link.dataset.link === "tel" ? "phone" : "wa";
    const value = ($('[data-f="' + key + '"]').textContent.match(/[\d+]/g) || []).join("");

    if (value.replace("+", "").length < 7) return;

    event.preventDefault();

    if (key === "phone") {
      window.location.href = "tel:" + value;
    } else {
      window.open("https://wa.me/" + value.replace("+", ""), "_blank", "noopener");
    }
  });
}

function init() {
  setDocTitle();
  renderCategoryChips();
  renderCatalog();
  initEditableText();
  initMenu();
  initSearch();
  initNavigationActiveState();
  initForm();
  initContactLinks();

  document.addEventListener("click", handleCatalogClicks);
}

init();
