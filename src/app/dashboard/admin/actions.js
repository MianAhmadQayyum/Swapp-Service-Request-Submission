"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase: null, error: "Forbidden" };
  return { supabase, error: null };
}

// --- User management ---

export async function revokeUserAccess(userId) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { data: { user } } = await supabase.auth.getUser();
  if (user.id === userId) return { error: "Cannot revoke your own access" };

  const { error } = await supabase
    .from("profiles")
    .update({ disabled: true })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function restoreUserAccess(userId) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("profiles")
    .update({ disabled: false })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}


export async function updateProfileRole(userId, role) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function updateProfileTeam(userId, teamId) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("profiles")
    .update({ team_id: teamId || null, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  return { success: true };
}

// --- Teams ---

export async function createTeam(formData) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const name = formData.get("name")?.toString()?.trim();
  if (!name) return { error: "Team name required" };
  const { error } = await supabase.from("teams").insert({ name });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteTeam(id) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

// --- Suppliers ---

export async function createSupplier(formData) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const title = formData.get("title")?.toString()?.trim();
  if (!title) return { error: "Name required" };
  const { error } = await supabase.from("suppliers").insert({ title });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteSupplier(id) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

// --- Issue types ---

export async function createIssueType(formData) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const title = formData.get("title")?.toString()?.trim();
  if (!title) return { error: "Title required" };

  const slaRaw = formData.get("sla_hours")?.toString()?.trim();
  const sla_resolution_hours_limit = slaRaw ? Number(slaRaw) : null;
  if (slaRaw && (isNaN(sla_resolution_hours_limit) || sla_resolution_hours_limit <= 0)) {
    return { error: "SLA hours must be a positive number" };
  }

  const { error } = await supabase.from("issue_types").insert({ title, sla_resolution_hours_limit });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function updateIssueTypeSla(id, slaHours) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const sla = slaHours ? Number(slaHours) : null;
  if (slaHours && (isNaN(sla) || sla <= 0)) return { error: "SLA hours must be a positive number" };

  const { error } = await supabase
    .from("issue_types")
    .update({ sla_resolution_hours_limit: sla })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteIssueType(id) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase.from("issue_types").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}
