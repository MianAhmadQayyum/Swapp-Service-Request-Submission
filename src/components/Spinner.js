export default function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 animate-spin" />
    </div>
  );
}
