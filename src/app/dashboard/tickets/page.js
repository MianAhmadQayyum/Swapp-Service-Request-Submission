import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCachedUser, getCachedProfile } from "@/lib/supabase/server";
import TicketFilters from "./TicketFilters";
import TicketTable from "./TicketTable";
import { FILTER_APPLY } from "@/lib/constants/tickets";
import { DEFAULT_ROLE, canCreateTickets, canAccessAdmin, isTeamMember } from "@/lib/constants/roles";

const PAGE_SIZE = 25;
const VALID_SORT_COLS = ["created_at", "booking_id", "status"];

export default async function TicketsPage({ searchParams }) {
  const user = await getCachedUser();
  if (!user) redirect("/signin");
  const supabase = await createClient();

  const profile = await getCachedProfile();
  const role = profile?.role ?? DEFAULT_ROLE;
  const userCanCreate = canCreateTickets(role);

  const params = await searchParams;
  const filter     = params?.filter ?? "";
  const supplierId = params?.supplier ?? "";
  const teamId     = canAccessAdmin(role) ? (params?.team ?? "") : "";
  const sort       = VALID_SORT_COLS.includes(params?.sort) ? params.sort : "created_at";
  const dir        = params?.dir === "asc" ? "asc" : "desc";
  const page       = Math.max(0, parseInt(params?.page ?? "0", 10));

  let query = supabase
    .from("tickets")
    .select(
      `id, booking_id, status, escalation_status, service_request_status, created_at,
       suppliers(title),
       issue_types!issue_category_id(title),
       teams!assignee_team_id(name)`,
      { count: "exact" }
    )
    .order(sort, { ascending: dir === "asc" })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (role === "customer_support") {
    query = query.eq("created_by", user.id);
  } else if (isTeamMember(role) && profile?.team_id) {
    query = query.eq("assignee_team_id", profile.team_id);
  }

  if (FILTER_APPLY[filter]) {
    query = FILTER_APPLY[filter](query);
  }

  if (supplierId) query = query.eq("supplier_id", supplierId);
  if (teamId)     query = query.eq("assignee_team_id", teamId);

  const { data: tickets, count, error } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const [{ data: suppliers }, { data: teams }] = await Promise.all([
    supabase.from("suppliers").select("id, title").order("title"),
    canAccessAdmin(role)
      ? supabase.from("teams").select("id, name").order("name")
      : Promise.resolve({ data: [] }),
  ]);

  // Build sort URLs — preserve current filter/supplier/team, reset page
  function sortUrl(col) {
    const p = new URLSearchParams();
    if (filter)     p.set("filter", filter);
    if (supplierId) p.set("supplier", supplierId);
    if (teamId)     p.set("team", teamId);
    p.set("sort", col);
    p.set("dir", sort === col && dir === "asc" ? "desc" : "asc");
    return `/dashboard/tickets?${p.toString()}`;
  }

  // Build page URLs — preserve current filter/supplier/team/sort
  function pageUrl(p) {
    const sp = new URLSearchParams();
    if (filter)        sp.set("filter", filter);
    if (supplierId)    sp.set("supplier", supplierId);
    if (teamId)        sp.set("team", teamId);
    if (sort !== "created_at") sp.set("sort", sort);
    if (dir  !== "desc")       sp.set("dir", dir);
    if (p > 0)         sp.set("page", p);
    return `/dashboard/tickets?${sp.toString()}`;
  }

  const sortUrls = {
    created_at: sortUrl("created_at"),
    booking_id: sortUrl("booking_id"),
    status:     sortUrl("status"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Tickets</h2>
        {userCanCreate && (
          <Link
            href="/dashboard/tickets/new"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-2 px-4 text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            + New ticket
          </Link>
        )}
      </div>
      <TicketFilters
        currentFilter={filter}
        supplierId={supplierId}
        suppliers={suppliers ?? []}
        teamId={teamId}
        teams={teams ?? []}
      />
      {error ? (
        <p className="text-red-600 dark:text-red-400 text-sm">{error.message}</p>
      ) : (
        <TicketTable
          tickets={tickets ?? []}
          sort={sort}
          dir={dir}
          sortUrls={sortUrls}
        />
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            Page {page + 1} of {totalPages}
            <span className="ml-2 text-zinc-400 dark:text-zinc-500">({count} total)</span>
          </span>
          <div className="flex gap-2">
            {page > 0 ? (
              <Link
                href={pageUrl(page - 1)}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ← Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 opacity-40 cursor-not-allowed">
                ← Previous
              </span>
            )}
            {page < totalPages - 1 ? (
              <Link
                href={pageUrl(page + 1)}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Next →
              </Link>
            ) : (
              <span className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 opacity-40 cursor-not-allowed">
                Next →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
