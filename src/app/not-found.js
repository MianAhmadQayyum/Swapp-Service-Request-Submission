import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900 px-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-zinc-300 dark:text-zinc-600 mb-4">404</p>
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
          Page not found
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium py-2 px-4 hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
