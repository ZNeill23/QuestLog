// -------------------
// HOUSEKEEPING
// -------------------
const questForm = document.getElementById("questForm");
const questInput = document.getElementById("questInput");
const questList = document.getElementById("questList");
const countText = document.getElementById("countText");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const filterButtons = document.querySelectorAll(".filter");

const STORAGE_KEY = "questlog.v1";

let quests = loadQuests(); // [{ id, text, done }]
let currentFilter = "all";

// -------------------
// INPUT
// -------------------
questForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = questInput.value.trim();
  if (!text) return;

  addQuest(text);
  questInput.value = "";
  questInput.focus();
});

clearDoneBtn.addEventListener("click", () => {
  quests = quests.filter(q => !q.done);
  saveQuests();
  render();
});

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    setActiveFilterButton(currentFilter);
    render();
  });
});

// -------------------
// PROCESSING
// -------------------
function addQuest(text) {
  const quest = {
    id: crypto.randomUUID(),
    text,
    done: false
  };

  quests.unshift(quest);
  saveQuests();
  render();
}

function toggleQuest(id) {
  const q = quests.find(q => q.id === id);
  if (!q) return;

  q.done = !q.done;
  saveQuests();
  render();
}

function deleteQuest(id) {
  quests = quests.filter(q => q.id !== id);
  saveQuests();
  render();
}

function getVisibleQuests() {
  if (currentFilter === "active") return quests.filter(q => !q.done);
  if (currentFilter === "done") return quests.filter(q => q.done);
  return quests;
}

// -------------------
// OUTPUT
// -------------------
function render() {
  const visible = getVisibleQuests();

  questList.innerHTML = "";
  visible.forEach(q => questList.appendChild(makeQuestElement(q)));

  const total = quests.length;
  const doneCount = quests.filter(q => q.done).length;

  countText.textContent = `${total} quest${total === 1 ? "" : "s"} • ${doneCount} done`;
}

function makeQuestElement(q) {
  const li = document.createElement("li");
  li.className = "item" + (q.done ? " done" : "");
  li.dataset.id = q.id;

  const check = document.createElement("button");
  check.type = "button";
  check.className = "check";
  check.setAttribute("aria-label", q.done ? "Mark as not done" : "Mark as done");
  check.textContent = q.done ? "✓" : "";
  check.addEventListener("click", () => toggleQuest(q.id));

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = q.text;

  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete";
  del.setAttribute("aria-label", "Delete quest");
  del.textContent = "🗑️";
  del.addEventListener("click", () => deleteQuest(q.id));

  li.append(check, text, del);
  return li;
}

// -------------------
// STORAGE
// -------------------
function saveQuests() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quests));
}

function loadQuests() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setActiveFilterButton(filter) {
  filterButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

// Initial paint
setActiveFilterButton(currentFilter);
render();