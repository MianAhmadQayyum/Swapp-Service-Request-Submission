import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import AdminUsers from "./AdminUsers";
import AdminSuppliers from "./AdminSuppliers";
import AdminIssueTypes from "./AdminIssueTypes";
import AdminSlaRules from "./AdminSlaRules";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "operations_manager") {
    redirect("/dashboard");
  }

  const isAdmin = profile?.role === "admin";

  const [{ data: suppliers }, { data: issueTypes }, { data: slaRules }] = await Promise.all([
    supabase.from("suppliers").select("id, name").order("name"),
    supabase.from("issue_types").select("id, name").order("name"),
    supabase
      .from("sla_rules")
      .select("id, resolution_hours, priority_level, issue_types(name)")
      .order("resolution_hours"),
  ]);

  let authUsers = [];
  if (isAdmin) {
    const adminClient = createServiceRoleClient();
    const { data: list } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    authUsers = list?.users ?? [];
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, team")
    .order("full_name");

  const profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Admin</h2>
      {isAdmin && (
        <section>
          <h3 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-4">
            Manage users & roles
          </h3>
          <AdminUsers
            authUsers={authUsers}
            profiles={profiles ?? []}
            profilesById={profilesById}
          />
        </section>
      )}
      <section>
        <h3 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-4">Suppliers</h3>
        <AdminSuppliers suppliers={suppliers ?? []} canEdit={isAdmin} />
      </section>
      <section>
        <h3 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-4">Issue types</h3>
        <AdminIssueTypes issueTypes={issueTypes ?? []} canEdit={isAdmin} />
      </section>
      <section>
        <h3 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-4">SLA rules</h3>
        <AdminSlaRules slaRules={slaRules ?? []} issueTypes={issueTypes ?? []} canEdit={isAdmin} />
      </section>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/dashboard" className="font-medium hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
