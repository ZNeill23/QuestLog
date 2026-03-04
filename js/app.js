// -------------------
// HOUSEKEEPING
// -------------------
const questForm = document.getElementById("questForm");
const questInput = document.getElementById("questInput");
const questList = document.getElementById("questList");
const countText = document.getElementById("countText");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const filterButtons = document.querySelectorAll(".filter");

const categorySelect = document.getElementById("categorySelect");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");

const STORAGE_KEY = "questlog.v2";

const CATEGORIES = ["General", "School", "Work", "Gaming", "Personal"];

let quests = loadQuests(); // [{ id, text, done, category }]
let currentFilter = "all";
let currentCategory = "all";
let searchQuery = "";

let editingId = null;

// -------------------
// INPUT
// -------------------
questForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = questInput.value.trim();
  if (!text) return;

  const category = categorySelect.value || "General";

  addQuest(text, category);
  questInput.value = "";
  questInput.focus();
});

clearDoneBtn.addEventListener("click", () => {
  quests = quests.filter((q) => !q.done);
  saveQuests();
  render();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    setActiveFilterButton(currentFilter);

    editingId = null;

    render();
  });
});

categoryFilter.addEventListener("change", () => {
  currentCategory = categoryFilter.value;
  editingId = null;
  render();
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  editingId = null;
  render();
});

// -------------------
// PROCESSING
// -------------------
function addQuest(text, category) {
  const quest = {
    id: crypto.randomUUID(),
    text,
    done: false,
    category: normalizeCategory(category),
  };

  quests.unshift(quest);
  saveQuests();
  render();
}

function toggleQuest(id) {
  const q = quests.find((q) => q.id === id);
  if (!q) return;

  if (editingId === id) return;

  q.done = !q.done;
  saveQuests();
  render();
}

function deleteQuest(id) {
  quests = quests.filter((q) => q.id !== id);

  if (editingId === id) editingId = null;

  saveQuests();
  render();
}

function startEditing(id) {
  const q = quests.find((q) => q.id === id);
  if (!q) return;

  editingId = id;
  render();

  const input = document.querySelector(`li[data-id="${id}"] .editInput`);
  if (input) {
    input.focus();
    input.select();
  }
}

function cancelEditing() {
  editingId = null;
  render();
}

function saveEditing(id, newText) {
  const q = quests.find((q) => q.id === id);
  if (!q) return;

  const cleaned = newText.trim();

  if (!cleaned) {
    cancelEditing();
    return;
  }

  q.text = cleaned;
  editingId = null;
  saveQuests();
  render();
}

function normalizeCategory(cat) {
  if (!cat) return "General";
  return CATEGORIES.includes(cat) ? cat : "General";
}

function matchesCategory(q) {
  if (currentCategory === "all") return true;
  return q.category === currentCategory;
}

function matchesStatus(q) {
  if (currentFilter === "active") return !q.done;
  if (currentFilter === "done") return q.done;
  return true;
}

function matchesSearch(q) {
  if (!searchQuery) return true;
  return q.text.toLowerCase().includes(searchQuery);
}

function getVisibleQuests() {
  return quests.filter(
    (q) => matchesStatus(q) && matchesCategory(q) && matchesSearch(q),
  );
}

// -------------------
// OUTPUT
// -------------------
function render() {
  const visible = getVisibleQuests();

  questList.innerHTML = "";
  visible.forEach((q) => questList.appendChild(makeQuestElement(q)));

  const total = quests.length;
  const doneCount = quests.filter((q) => q.done).length;

  const catText =
    currentCategory === "all" ? "All Categories" : currentCategory;

  countText.textContent = `${total} quest${total === 1 ? "" : "s"} • ${doneCount} done • ${catText}`;
}

function makeQuestElement(q) {
  const li = document.createElement("li");
  const isEditing = editingId === q.id;

  li.className =
    "item" + (q.done ? " done" : "") + (isEditing ? " editing" : "");

  li.dataset.id = q.id;

  const check = document.createElement("button");
  check.type = "button";
  check.className = "check";
  check.setAttribute(
    "aria-label",
    q.done ? "Mark as not done" : "Mark as done",
  );
  check.innerHTML = q.done ? "✔" : "";
  check.addEventListener("click", () => toggleQuest(q.id));

  let middle;

  if (!isEditing) {
    const textWrap = document.createElement("div");

    const text = document.createElement("div");
    text.className = "text";
    text.textContent = q.text;

    text.addEventListener("dblclick", () => startEditing(q.id));

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = q.category;

    textWrap.append(text, badge);
    middle = textWrap;
  } else {
    const input = document.createElement("input");
    input.className = "editInput";
    input.type = "text";
    input.value = q.text;
    input.maxLength = 80;

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveEditing(q.id, input.value);
      } else if (e.key === "Escape") {
        cancelEditing();
      }
    });

    input.addEventListener("blur", () => {
      saveEditing(q.id, input.value);
    });

    middle = input;
  }

  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete";
  del.setAttribute("aria-label", "Delete quest");
  del.innerHTML = `
    <svg class="trashIcon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM6 7h12l-1 14H7L6 7z"/>
    </svg>
    `;
  del.addEventListener("click", () => deleteQuest(q.id));

  li.append(check, middle, del);

  if (isEditing) {
    const hint = document.createElement("div");
    hint.className = "editHint";
    hint.textContent = "Enter = save • Esc = cancel • click outside = save";
    li.appendChild(hint);
  }

  return li;
}

// -------------------
// STORAGE
// -------------------
function saveQuests() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quests));
}

function loadQuests() {
  const v2 = localStorage.getItem("questlog.v2");
  if (v2) {
    try {
      const parsed = JSON.parse(v2);
      return sanitizeQuestArray(parsed);
    } catch {
      return [];
    }
  }

  const v1 = localStorage.getItem("questlog.v1");
  if (!v1) return [];

  try {
    const parsed = JSON.parse(v1);
    const migrated = sanitizeQuestArray(parsed).map((q) => ({
      ...q,
      category: normalizeCategory(q.category),
    }));

    migrated.forEach((q) => {
      if (!q.category) q.category = "General";
    });

    localStorage.setItem("questlog.v2", JSON.stringify(migrated));
    return migrated;
  } catch {
    return [];
  }
}

function sanitizeQuestArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((q) => q && typeof q === "object")
    .map((q) => ({
      id: String(q.id || crypto.randomUUID()),
      text: String(q.text || "").trim(),
      done: Boolean(q.done),
      category: normalizeCategory(q.category || "General"),
    }))
    .filter((q) => q.text.length > 0);
}

function setActiveFilterButton(filter) {
  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

// Initial paint
setActiveFilterButton(currentFilter);
categoryFilter.value = currentCategory;
searchInput.value = "";
render();
