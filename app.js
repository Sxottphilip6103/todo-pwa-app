const STORAGE_KEY = "todo-pwa-items-v1";

const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const remainingCount = document.getElementById("remainingCount");
const totalCount = document.getElementById("totalCount");
const clearCompletedBtn = document.getElementById("clearCompleted");
const installBtn = document.getElementById("installBtn");
const filterButtons = document.querySelectorAll(".filter");

let items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = "all";
let deferredPrompt = null;

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFilteredItems() {
  if (currentFilter === "active") {
    return items.filter(item => !item.completed);
  }
  if (currentFilter === "completed") {
    return items.filter(item => item.completed);
  }
  return items;
}

function render() {
  const filteredItems = getFilteredItems();

  if (filteredItems.length === 0) {
    todoList.innerHTML = `
      <li class="empty-state">
        ${items.length === 0
          ? "No tasks yet. Add one above."
          : "No tasks match this filter."}
      </li>
    `;
  } else {
    todoList.innerHTML = filteredItems
      .map(
        item => `
          <li class="todo-item ${item.completed ? "completed" : ""}" data-id="${item.id}">
            <div class="todo-main">
              <input
                class="todo-checkbox"
                type="checkbox"
                ${item.completed ? "checked" : ""}
                aria-label="Mark task complete"
              />
              <span class="todo-text">${escapeHtml(item.text)}</span>
            </div>
            <button class="delete-btn" aria-label="Delete task">&times;</button>
          </li>
        `
      )
      .join("");
  }

  const remaining = items.filter(item => !item.completed).length;
  remainingCount.textContent = `${remaining} task${remaining === 1 ? "" : "s"} left`;
  totalCount.textContent = `${items.length} total`;

  document.querySelectorAll(".todo-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", event => {
      const itemId = Number(event.target.closest(".todo-item").dataset.id);
      toggleTodo(itemId);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", event => {
      const itemId = Number(event.target.closest(".todo-item").dataset.id);
      deleteTodo(itemId);
    });
  });
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  items.unshift({
    id: Date.now() + Math.random(),
    text: trimmed,
    completed: false
  });

  saveItems();
  render();
  todoInput.value = "";
  todoInput.focus();
}

function toggleTodo(id) {
  items = items.map(item =>
    item.id === id ? { ...item, completed: !item.completed } : item
  );
  saveItems();
  render();
}

function deleteTodo(id) {
  items = items.filter(item => item.id !== id);
  saveItems();
  render();
}

function clearCompleted() {
  items = items.filter(item => !item.completed);
  saveItems();
  render();
}

todoForm.addEventListener("submit", event => {
  event.preventDefault();
  addTodo(todoInput.value);
});

clearCompletedBtn.addEventListener("click", clearCompleted);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });
    render();
  });
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  if (result.outcome === "accepted") {
    console.log("PWA installed");
  }
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(err => {
      console.log("Service worker registration failed:", err);
    });
  });
}

render();