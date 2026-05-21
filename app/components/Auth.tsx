"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("メールアドレスまたはパスワードが間違っています");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("確認メールを送信しました。メールをご確認ください。");
      }
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            ✅ ToDoリスト
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {mode === "login" ? "ログインして続ける" : "アカウントを作成する"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />

          {error && (
            <p className="text-xs px-1" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          {message && (
            <p className="text-xs px-1 text-green-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl text-white font-medium text-sm transition-opacity disabled:opacity-50 mt-1"
            style={{ background: "var(--accent)" }}
          >
            {loading ? "処理中..." : mode === "login" ? "ログイン" : "アカウント作成"}
          </button>
        </form>

        {/* Switch mode */}
        <p className="mt-5 text-center text-sm" style={{ color: "var(--muted)" }}>
          {mode === "login" ? "アカウントをお持ちでない方は" : "すでにアカウントをお持ちの方は"}
          <button
            onClick={switchMode}
            className="ml-1 font-medium underline underline-offset-2"
            style={{ color: "var(--accent)" }}
          >
            {mode === "login" ? "新規登録" : "ログイン"}
          </button>
        </p>
      </div>
    </div>
  );
}
