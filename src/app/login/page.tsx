"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="card w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">👕</div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to WoreIt</h1>
          <p className="text-sm text-muted">We&apos;ll email you a magic link.</p>
        </div>

        {sent ? (
          <div className="text-center text-sm space-y-3">
            <p>Check {email} for a sign-in link.</p>
            <button
              onClick={() => setSent(false)}
              className="text-muted underline text-xs"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={sendMagicLink} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 px-4 rounded-full border border-border bg-background"
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-50"
              >
                {loading ? "Sending…" : "Email me a link"}
              </button>
            </form>

            <div className="flex items-center gap-3 text-xs text-muted">
              <div className="flex-1 h-px bg-border" /> or
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={signInWithGoogle}
              className="w-full h-12 rounded-full border border-border font-medium flex items-center justify-center gap-2"
            >
              Continue with Google
            </button>
          </>
        )}

        {error && <p className="text-sm text-danger text-center">{error}</p>}
      </div>
    </main>
  );
}
