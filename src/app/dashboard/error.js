"use client";

export default function DashboardError({ reset }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
        Something went wrong
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium py-2 px-4 hover:bg-zinc-800 dark:hover:bg-zinc-200"
      >
        Try again
      </button>
    </div>
  );
}
