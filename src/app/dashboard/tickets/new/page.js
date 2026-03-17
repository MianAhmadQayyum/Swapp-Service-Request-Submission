import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCachedUser, getCachedProfile } from "@/lib/supabase/server";
import NewTicketForm from "./NewTicketForm";
import { DEFAULT_ROLE, canCreateTickets } from "@/lib/constants/roles";

export default async function NewTicketPage() {
  const user = await getCachedUser();
  if (!user) redirect("/signin");
  const supabase = await createClient();

  const profile = await getCachedProfile();
  const role = profile?.role ?? DEFAULT_ROLE;
  if (!canCreateTickets(role)) {
    redirect("/dashboard");
  }

  const [
    { data: suppliers },
    { data: issueTypes },
    { data: csAgents },
    { data: teams },
  ] = await Promise.all([
    supabase.from("suppliers").select("id, title").order("title"),
    supabase.from("issue_types").select("id, title").order("title"),
    supabase.from("profiles").select("id, name").eq("role", "customer_support").order("name"),
    supabase.from("teams").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-6">
        New service request
      </h2>
      <NewTicketForm
        suppliers={suppliers ?? []}
        issueTypes={issueTypes ?? []}
        csAgents={csAgents ?? []}
        teams={teams ?? []}
        role={role}
      />
      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/dashboard/tickets" className="font-medium hover:underline">
          ← Back to tickets
        </Link>
      </p>
    </div>
  );
}
