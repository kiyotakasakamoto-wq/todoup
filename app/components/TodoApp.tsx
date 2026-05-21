"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Todo } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Auth from "./Auth";

export default function TodoApp() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [isComposing, setIsComposing] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // 認証状態の監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ToDoの取得とリアルタイム同期
  useEffect(() => {
    if (!user) {
      setTodos([]);
      return;
    }

    const fetchTodos = async () => {
      const { data } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setTodos(data as Todo[]);
    };

    fetchTodos();

    // リアルタイム更新（他の端末で変更があると自動反映）
    const channel = supabase
      .channel("todos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        fetchTodos
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addTodo = async () => {
    const text = input.trim();
    if (!text || !user) return;

    const { data } = await supabase
      .from("todos")
      .insert({ text, done: false, user_id: user.id })
      .select()
      .single();

    if (data) setTodos((prev) => [data as Todo, ...prev]);
    setInput("");
    inputRef.current?.focus();
  };

  const toggleTodo = async (id: string, done: boolean) => {
    await supabase.from("todos").update({ done: !done }).eq("id", id);
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !done } : t))
    );
  };

  const deleteTodo = async (id: string) => {
    await supabase.from("todos").delete().eq("id", id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--muted)" }}>読み込み中...</p>
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    return <Auth />;
  }

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
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              ✅ ToDoリスト
            </h1>
            {totalCount > 0 && (
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {doneCount} / {totalCount} 件完了
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 pt-1">
            <p className="text-xs truncate max-w-[160px]" style={{ color: "var(--muted)" }}>
              {user.email}
            </p>
            <button
              onClick={signOut}
              className="text-xs px-3 py-1 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              ログアウト
            </button>
          </div>
        </div>
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
                  ? {
                      background: "#fff",
                      color: "var(--accent)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    }
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
          <li
            className="text-center py-12"
            style={{ color: "var(--muted)" }}
          >
            {filter === "done"
              ? "完了したタスクはありません"
              : "タスクがありません"}
          </li>
        )}
        {filtered.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group"
            style={{
              background: todo.done ? "var(--done-bg)" : "#fff",
              border: `1px solid ${
                todo.done ? "var(--done-border)" : "var(--border)"
              }`,
            }}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleTodo(todo.id, todo.done)}
              className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
              style={{
                borderColor: todo.done ? "#4ade80" : "var(--muted)",
                background: todo.done ? "#4ade80" : "transparent",
              }}
              aria-label={todo.done ? "未完了に戻す" : "完了にする"}
            >
              {todo.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
                <path
                  d="M1 1L13 13M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
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
