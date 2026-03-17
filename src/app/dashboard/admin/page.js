import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCachedUser, getCachedProfile } from "@/lib/supabase/server";
import AdminUsers from "./AdminUsers";
import AdminSimpleList from "./AdminSimpleList";
import AdminIssueTypes from "./AdminIssueTypes";
import { createSupplier, deleteSupplier, createTeam, deleteTeam } from "./actions";
import { canAccessAdmin } from "@/lib/constants/roles";

export default async function AdminPage() {
  const user = await getCachedUser();
  if (!user) redirect("/signin");
  const supabase = await createClient();

  const profile = await getCachedProfile();
  if (!canAccessAdmin(profile?.role)) redirect("/dashboard");

  const [
    { data: suppliers },
    { data: issueTypes },
    { data: teams },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("suppliers").select("id, title").order("title"),
    supabase.from("issue_types").select("id, title, sla_resolution_hours_limit").order("title"),
    supabase.from("teams").select("id, name").order("name"),
    supabase.from("profiles").select("id, name, email, role, team_id, disabled").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Admin</h2>

      <section>
        <h3 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-4">
          Users &amp; roles
        </h3>
        <AdminUsers
          profiles={profiles ?? []}
          teams={teams ?? []}
        />
      </section>

      <section>
        <h3 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-4">Teams</h3>
        <AdminSimpleList
          items={(teams ?? []).map((t) => ({ id: t.id, label: t.name }))}
          fieldName="name"
          placeholder="Team name"
          onCreate={createTeam}
          onDelete={deleteTeam}
        />
      </section>

      <section>
        <h3 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-4">Suppliers</h3>
        <AdminSimpleList
          items={(suppliers ?? []).map((s) => ({ id: s.id, label: s.title }))}
          fieldName="title"
          placeholder="Supplier name"
          onCreate={createSupplier}
          onDelete={deleteSupplier}
        />
      </section>

      <section>
        <h3 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-4">
          Issue types &amp; SLA
        </h3>
        <AdminIssueTypes issueTypes={issueTypes ?? []} />
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/dashboard" className="font-medium hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
