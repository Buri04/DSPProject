import { useState, useEffect, useMemo } from "react";
import type { Todo, TodoStatus } from "./types";
import './App.css';

const API_URL = "http://127.0.0.1:8000/api/tasks/";

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

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<{ title: string; description: string; status: TodoStatus }>({
    title: "",
    description: "",
    status: "offen",
  });

  const fetchTodos = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`Fehler beim Laden: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setTodos(data.map((t: any) => ({ ...t, status: backendToFrontendStatus[t.status] || "offen" })));
    } catch (err: any) {
      console.error(err);
      alert("Fehler beim Laden der Aufgaben. Prüfe die Backend-Verbindung.");
    }
  };

  const addTodo = async () => {
    if (!title.trim()) { alert("Titel ist ein Pflichtfeld!"); return; }
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status: frontendToBackendStatus[newStatus] || "open",
        }),
      });
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      const newTodo = await res.json();
      setTodos([...todos, { ...newTodo, status: backendToFrontendStatus[newTodo.status] }]);
      setTitle(""); setDescription(""); setNewStatus("offen");
    } catch (err: any) { console.error(err); alert(`Fehler beim Hinzufügen: ${err.message}`); }
  };

  const updateStatus = async (id: number, frontendStatus: TodoStatus, title?: string, description?: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) throw new Error("Aufgabe nicht gefunden");
      const backendStatus = frontendToBackendStatus[frontendStatus];
      const res = await fetch(`${API_URL}${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...todo, status: backendStatus, title: title ?? todo.title, description: description ?? todo.description }),
      });
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      const updatedTodo = await res.json();
      setTodos(todos.map(t => t.id === id ? { ...updatedTodo, status: backendToFrontendStatus[updatedTodo.status] || "offen" } : t));
      setEditingId(null);
    } catch (err: any) { console.error(err); alert(`Fehler beim Aktualisieren: ${err.message}`); }
  };

  const deleteTodo = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err: any) { console.error(err); alert(`Fehler beim Löschen: ${err.message}`); }
  };

  useEffect(() => { fetchTodos(); }, []);

  const displayedTodos = useMemo(() => {
    let filtered = todos;
    if (filterStatus !== "alle") filtered = filtered.filter(todo => todo.status === filterStatus);
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
      <div className="w-full max-w-xl bg-white shadow-md rounded box-border">

        <div className="px-6 py-6 w-full box-border">

          <h1 className="text-2xl font-bold mb-6 text-center">To-Do-App</h1>

          {/* Suche & Filter */}
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Suche & Filter</h2>
            <div className="flex flex-wrap gap-2 items-center w-full">
              <input className="border rounded p-2 flex-1" placeholder="Suche..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="border rounded p-2" value={filterStatus} onChange={e => setFilterStatus(e.target.value as TodoStatus | "alle")}>
                <option value="alle">Alle</option>
                <option value="offen">Offen</option>
                <option value="in Bearbeitung">In Bearbeitung</option>
                <option value="erledigt">Erledigt</option>
              </select>
            </div>
          </div>

          {/* Sortieren */}
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Sortieren</h2>
            <select className="border rounded p-2 w-full" value={sortBy} onChange={e => setSortBy(e.target.value as "title" | "id")}>
              <option value="id">Erstellt</option>
              <option value="title">Titel</option>
            </select>
          </div>

          {/* Neue Aufgabe hinzufügen */}
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Neue Aufgabe hinzufügen</h2>
            <div className="flex flex-col gap-2">
              <input className="border rounded p-2 w-full" placeholder="Titel" value={title} onChange={e => setTitle(e.target.value)} />
              <input className="border rounded p-2 w-full" placeholder="Beschreibung (optional)" value={description} onChange={e => setDescription(e.target.value)} />
              <select className="border rounded p-2 w-full" value={newStatus} onChange={e => setNewStatus(e.target.value as TodoStatus)}>
                <option value="offen">Offen</option>
                <option value="in Bearbeitung">In Bearbeitung</option>
                <option value="erledigt">Erledigt</option>
              </select>
              <button
  className="w-full border-2 border-green-600 text-green-600 bg-white px-4 py-2 rounded hover:bg-green-600 hover:text-white transition"

                  onClick={addTodo}
              >
                Aufgabe hinzufügen
              </button>
            </div>
          </div>


          {/* To-Do Liste – exakt gleiche Breite */}

          <br></br>
          <br></br>
          <br></br>
          <h2 className="font-semibold mb-2">To-Do-Liste:</h2>
          <div className="w-full box-border flex flex-col gap-2">
            {displayedTodos.map(todo => (
              <div key={todo.id} className="border rounded w-full flex flex-col p-2 box-border">
                {editingId === todo.id ? (
                  <div className="flex flex-col gap-2 w-full">
                    <input className="border rounded p-1 w-full" value={editFields.title} onChange={e => setEditFields({ ...editFields, title: e.target.value })} />
                    <input className="border rounded p-1 w-full" value={editFields.description} onChange={e => setEditFields({ ...editFields, description: e.target.value })} />
                    <select className="border rounded p-1 w-full" value={editFields.status} onChange={e => setEditFields({ ...editFields, status: e.target.value as TodoStatus })}>
                      <option value="offen">Offen</option>
                      <option value="in Bearbeitung">In Bearbeitung</option>
                      <option value="erledigt">Erledigt</option>
                    </select>
                    <div className="flex gap-2 justify-end">
                      <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition" onClick={() => updateStatus(todo.id, editFields.status, editFields.title, editFields.description)}>Speichern</button>
                      <button className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500 transition" onClick={() => setEditingId(null)}>Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between w-full">
                    <div className="flex-1 pr-2">
                      <p className="font-semibold">{todo.title}</p>
                      {todo.description && <p className="text-sm text-gray-600">{todo.description}</p>}
                      <p className="text-sm font-medium">Status: {todo.status}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500 transition" onClick={() => { setEditingId(todo.id); setEditFields({ title: todo.title, description: todo.description || "", status: todo.status }); }}>Bearbeiten</button>
                      <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition" onClick={() => deleteTodo(todo.id)}>Löschen</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
