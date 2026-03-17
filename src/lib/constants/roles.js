// Single source of truth for user roles and permission checks.
// Add a new role here and update the permission helpers — all pages update automatically.

export const DEFAULT_ROLE = "customer_support";

// Used in role dropdown (admin panel, signup).
export const ROLES = [
  { value: "customer_support", label: "Customer Support" },
  { value: "team_member",      label: "Team Member" },
  { value: "admin",            label: "Admin" },
];

// Nav/header display labels. null means "show team name instead".
export const ROLE_LABELS = {
  admin:            "Admin",
  customer_support: "Customer Support",
  team_member:      null,
};

// Permission helpers — update these when adding a role, not every page.
export const canCreateTickets = (role) => role === "customer_support" || role === "admin";
export const canViewDashboard = (role) => role === "admin" || role === "team_member";
export const canAccessAdmin   = (role) => role === "admin";
export const isTeamMember     = (role) => role === "team_member";

// Only admins and team members can update tickets.
export const canUpdateTicket = (role) =>
  role === "admin" || role === "team_member";
