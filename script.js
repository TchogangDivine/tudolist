// Charger les tâches au démarrage
document.addEventListener("DOMContentLoaded", loadTodos);

function addTodo() {
    const input = document.getElementById("todo-input");
    const todoText = input.value.trim();

    if (todoText === "") return;

    const todo = {
        text: todoText
    };

    saveTodo(todo);
    displayTodo(todo);

    input.value = "";
}

// Afficher une tâche
function displayTodo(todo) {
    const todoList = document.getElementById("todo-list");
    const li = document.createElement("li");
    li.textContent = todo.text;

    // Bouton supprimer
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Supprimer";
    deleteBtn.className = "delete-btn";

    deleteBtn.style.marginLeft = "10px";

    deleteBtn.onclick = () => {
        li.remove();
        removeTodo(todo.text);
    };

    li.appendChild(deleteBtn);
    todoList.appendChild(li);
}

// Sauvegarder dans localStorage
function saveTodo(todo) {
    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    todos.push(todo);
    localStorage.setItem("todos", JSON.stringify(todos));
}

// Charger les tâches
function loadTodos() {
    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    todos.forEach(displayTodo);
}

// Supprimer une tâche
function removeTodo(text) {
    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    todos = todos.filter(todo => todo.text !== text);
    localStorage.setItem("todos", JSON.stringify(todos));
}
