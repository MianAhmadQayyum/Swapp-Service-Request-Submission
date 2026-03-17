"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ROLES, DEFAULT_ROLE, isTeamMember } from "@/lib/constants/roles";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Fetch teams when team_member is selected
  useEffect(() => {
    if (isTeamMember(role) && teams.length === 0) {
      supabase
        .from("teams")
        .select("id, name")
        .order("name")
        .then(({ data }) => setTeams(data ?? []));
    }
  }, [role]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (isTeamMember(role) && !teamId) {
      setError("Please select a team.");
      return;
    }

    setLoading(true);
    const metadata = {
      full_name: fullName.trim() || undefined,
      role,
      ...(isTeamMember(role) && teamId ? { team_id: teamId } : {}),
    };

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: metadata,
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setMessage(
      "Account created. Check your email to confirm, or sign in if confirmation is disabled."
    );
    router.refresh();
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
          Sign up
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
          Create an account with your email, password, and role.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className={inputCls}
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputCls}
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">At least 6 characters</p>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Role *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => { setRole(e.target.value); setTeamId(""); }}
              required
              className={inputCls}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {isTeamMember(role) && (
            <div>
              <label htmlFor="team_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Team *
              </label>
              <select
                id="team_id"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium py-2.5 px-4 hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="font-medium text-zinc-600 dark:text-zinc-300 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
