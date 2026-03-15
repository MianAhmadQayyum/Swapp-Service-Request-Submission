"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileRole(userId, role) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function updateProfileTeam(userId, team) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const { error } = await supabase
    .from("profiles")
    .update({ team: team || null, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  return { success: true };
}

export async function createSupplier(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const name = formData.get("name")?.toString()?.trim();
  if (!name) return { error: "Name required" };
  const { error } = await supabase.from("suppliers").insert({ name });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteSupplier(id) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function createIssueType(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const name = formData.get("name")?.toString()?.trim();
  if (!name) return { error: "Name required" };
  const { error } = await supabase.from("issue_types").insert({ name });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteIssueType(id) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const { error } = await supabase.from("issue_types").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function createSlaRule(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const issue_type_id = formData.get("issue_type_id")?.toString();
  const resolution_hours = Number(formData.get("resolution_hours"));
  const priority_level = formData.get("priority_level")?.toString() || null;
  if (!issue_type_id || !resolution_hours || resolution_hours <= 0)
    return { error: "Issue type and resolution hours required" };

  const { error } = await supabase.from("sla_rules").insert({
    issue_type_id,
    resolution_hours,
    priority_level: priority_level || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteSlaRule(id) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const { error } = await supabase.from("sla_rules").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}
