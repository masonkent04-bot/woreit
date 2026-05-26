"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Why a Suspense wrap: useSearchParams forces dynamic rendering;
// wrapping the inner component lets the static shell render first.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Surface auth callback errors so users know what happened
  // (previously they silently bounced back to /login with no feedback)
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth") {
      setError(
        "Couldn't sign you in with that link. Try the 6-digit code from the email instead, or request a new link."
      );
    }
  }, [searchParams]);

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

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifyLoading(true);
    setError(null);
    const supabase = createClient();
    const token = code.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Supabase uses different OTP types depending on whether the user is new
    // (signup) or returning (magiclink). 'email' is a unified alias but doesn't
    // always work — try them all so the user doesn't have to know which they are.
    const types: Array<"email" | "magiclink" | "signup"> = ["email", "magiclink", "signup"];
    let lastErr: string | null = null;
    for (const type of types) {
      const { error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type });
      if (!error) {
        setVerifyLoading(false);
        router.push("/");
        return;
      }
      lastErr = error.message;
    }
    setVerifyLoading(false);
    setError(lastErr ?? "Invalid or expired code");
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
          <p className="text-sm text-muted">We&apos;ll email you a link or a 6-digit code.</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-center text-muted">
              Check <span className="text-foreground font-medium">{email}</span> for the email.
              Click the link, or paste the 6-digit code below.
            </p>

            <form onSubmit={verifyCode} className="space-y-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="12345678"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                className="w-full h-12 px-4 rounded-full border border-border bg-background text-center text-lg tracking-[0.3em] font-mono"
                aria-label="One-time code"
              />
              <button
                type="submit"
                disabled={verifyLoading || code.length < 6}
                className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-50"
              >
                {verifyLoading ? "Verifying…" : "Sign in with code"}
              </button>
            </form>

            <button
              onClick={() => { setSent(false); setCode(""); setError(null); }}
              className="block mx-auto text-muted underline text-xs"
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
