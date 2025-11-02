import { useState, useEffect, useMemo } from "react";
import type { Todo, TodoStatus } from "./types";
import './App.css';

const API_URL = "http://127.0.0.1:8000/api/tasks/";

// Mapping Frontend ↔ Backend
const frontendToBackendStatus: Record<TodoStatus, string> = {
  offen: "open",
  "in Bearbeitung": "in_progress",
  erledigt: "done",
};

const backendToFrontendStatus: Record<string, TodoStatus> = {
  open: "offen",
  in_progress: "in Bearbeitung",
  done: "erledigt",
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newStatus, setNewStatus] = useState<TodoStatus>("offen");
  const [filterStatus, setFilterStatus] = useState<TodoStatus | "alle">("alle");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "id">("id");

  // ---- Fetch todos ----
  const fetchTodos = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`Fehler beim Laden: ${res.status} ${res.statusText}`);
      const data = await res.json();
      const mappedTodos = data.map((t: any) => ({
        ...t,
        status: backendToFrontendStatus[t.status] || "offen",
      }));
      setTodos(mappedTodos);
    } catch (err: any) {
      console.error(err);
      alert("Fehler beim Laden der Aufgaben. Prüfe die Backend-Verbindung.");
    }
  };

  // ---- Add Todo ----
  const addTodo = async () => {
    if (!title.trim()) {
      alert("Titel ist ein Pflichtfeld!");
      return;
    }

    try {
      const backendStatus = frontendToBackendStatus[newStatus]; // ✅ korrekt typisiert
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status: backendStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Fehler ${res.status}: ${JSON.stringify(errorData)}`);
      }

      const newTodo = await res.json();
      setTodos([...todos, { ...newTodo, status: backendToFrontendStatus[newTodo.status] || "offen" }]);
      setTitle("");
      setDescription("");
      setNewStatus("offen");
    } catch (err: any) {
      console.error(err);
      alert(`Fehler beim Hinzufügen: ${err.message}`);
    }
  };

  // ---- Update Status ----
  const updateStatus = async (id: number, frontendStatus: TodoStatus) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) throw new Error("Aufgabe nicht gefunden");

      const backendStatus = frontendToBackendStatus[frontendStatus];
      const res = await fetch(`${API_URL}${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...todo, status: backendStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Fehler ${res.status}: ${JSON.stringify(errorData)}`);
      }

      const updatedTodo = await res.json();
      setTodos(todos.map(t =>
        t.id === id
          ? { ...updatedTodo, status: backendToFrontendStatus[updatedTodo.status] || "offen" }
          : t
      ));
    } catch (err: any) {
      console.error(err);
      alert(`Fehler beim Aktualisieren: ${err.message}`);
    }
  };

  // ---- Delete Todo ----
  const deleteTodo = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Fehler ${res.status}: ${res.statusText}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(`Fehler beim Löschen: ${err.message}`);
    }
  };

  // ---- Load todos on mount ----
  useEffect(() => {
    fetchTodos();
  }, []);

  // ---- Filter, Suche, Sortierung ----
  const displayedTodos = useMemo(() => {
    let filtered = todos;

    if (filterStatus !== "alle") {
      filtered = filtered.filter(todo => todo.status === filterStatus);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query)
      );
    }

    if (sortBy === "title") filtered = filtered.slice().sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "id") filtered = filtered.slice().sort((a, b) => a.id - b.id);

    return filtered;
  }, [todos, filterStatus, search, sortBy]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xl bg-white shadow-md rounded p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">To-Do-App</h1>

        {/* ---- Such- und Filterblock ---- */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <input
            className="border rounded p-2 flex-1"
            placeholder="Suche..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => fetchTodos()}
          >
            Suchen
          </button>
          <select
            className="border rounded p-2"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as TodoStatus | "alle")}
          >
            <option value="alle">Alle</option>
            <option value="offen">Offen</option>
            <option value="in Bearbeitung">In Bearbeitung</option>
            <option value="erledigt">Erledigt</option>
          </select>
        </div>

        {/* ---- Sortierblock ---- */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Sortieren</h2>
          <select
            className="border rounded p-2 w-full"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as "title" | "id")}
          >
            <option value="id">Erstellt</option>
            <option value="title">Titel</option>
          </select>
        </div>

        {/* ---- Hinzufügen-Block ---- */}
        <div className="mb-6 flex flex-col gap-2">
          <input
            className="border rounded p-2"
            placeholder="Titel"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <input
            className="border rounded p-2"
            placeholder="Beschreibung (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <select
            className="border rounded p-2"
            value={newStatus}
            onChange={e => setNewStatus(e.target.value as TodoStatus)}
          >
            <option value="offen">Offen</option>
            <option value="in Bearbeitung">In Bearbeitung</option>
            <option value="erledigt">Erledigt</option>
          </select>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={addTodo}
          >
            Hinzufügen
          </button>
        </div>

        {/* ---- To-Do Liste ---- */}
        <ul className="space-y-2">
          {displayedTodos.map(todo => (
            <li key={todo.id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{todo.title}</p>
                {todo.description && <p className="text-sm text-gray-600">{todo.description}</p>}
                <p className="text-sm font-medium">Status: {todo.status}</p>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={todo.status}
                  onChange={e => updateStatus(todo.id, e.target.value as TodoStatus)}
                  className="border rounded p-1"
                >
                  <option value="offen">offen</option>
                  <option value="in Bearbeitung">in Bearbeitung</option>
                  <option value="erledigt">erledigt</option>
                </select>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                  onClick={() => deleteTodo(todo.id)}
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
