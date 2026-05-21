"use client";

import { useState, useEffect, useRef } from "react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("todos");
    if (saved) setTodos(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() },
      ...prev,
    ]);
    setInput("");
    inputRef.current?.focus();
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const doneCount = todos.filter((t) => t.done).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="w-full max-w-lg mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          ✅ ToDoリスト
        </h1>
        {totalCount > 0 && (
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {doneCount} / {totalCount} 件完了
          </p>
        )}
      </div>

      {/* Input */}
      <div
        className="w-full max-w-lg flex gap-2 p-3 rounded-2xl shadow-sm mb-6"
        style={{ background: "#fff", border: "1px solid var(--border)" }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => e.key === "Enter" && !isComposing && addTodo()}
          placeholder="新しいタスクを入力…"
          className="flex-1 bg-transparent outline-none text-base placeholder:text-gray-300"
          style={{ color: "var(--foreground)" }}
        />
        <button
          onClick={addTodo}
          disabled={!input.trim()}
          className="px-4 py-1.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          追加
        </button>
      </div>

      {/* Filter tabs */}
      {totalCount > 0 && (
        <div
          className="w-full max-w-lg flex gap-1 p-1 rounded-xl mb-5"
          style={{ background: "#eeedf0" }}
        >
          {(["all", "active", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={
                filter === f
                  ? { background: "#fff", color: "var(--accent)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                  : { color: "var(--muted)" }
              }
            >
              {f === "all" ? "すべて" : f === "active" ? "未完了" : "完了済み"}
            </button>
          ))}
        </div>
      )}

      {/* Todo list */}
      <ul className="w-full max-w-lg flex flex-col gap-2">
        {filtered.length === 0 && (
          <li className="text-center py-12" style={{ color: "var(--muted)" }}>
            {filter === "done" ? "完了したタスクはありません" : "タスクがありません"}
          </li>
        )}
        {filtered.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group"
            style={{
              background: todo.done ? "var(--done-bg)" : "#fff",
              border: `1px solid ${todo.done ? "var(--done-border)" : "var(--border)"}`,
            }}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleTodo(todo.id)}
              className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
              style={{
                borderColor: todo.done ? "#4ade80" : "var(--muted)",
                background: todo.done ? "#4ade80" : "transparent",
              }}
              aria-label={todo.done ? "未完了に戻す" : "完了にする"}
            >
              {todo.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Text */}
            <span
              className="flex-1 text-sm leading-relaxed"
              style={{
                color: todo.done ? "var(--muted)" : "var(--foreground)",
                textDecoration: todo.done ? "line-through" : "none",
              }}
            >
              {todo.text}
            </span>

            {/* Delete */}
            <button
              onClick={() => deleteTodo(todo.id)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center transition-all"
              style={{ color: "var(--danger)" }}
              aria-label="削除"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {/* Footer hint */}
      <p className="mt-10 text-xs" style={{ color: "var(--muted)" }}>
        Enterキーでも追加できます
      </p>
    </div>
  );
}
