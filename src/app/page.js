import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <main className="flex max-w-md flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Swapp Internal Ticketing
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Sign in to access the dashboard, or create an account if you don’t have one yet.
        </p>
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
          <Link
            href="/signin"
            className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 px-6 font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Sign up
          </Link>
        </div>
      </main>
    </div>
  );
}
