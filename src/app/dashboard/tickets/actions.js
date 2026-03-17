"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { DEFAULT_STATUS } from "@/lib/constants/tickets";

export async function createTicket(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const booking_id = formData.get("booking_id")?.toString()?.trim();
  const supplier_id = formData.get("supplier_id")?.toString()?.trim();
  const cs_agent_id = formData.get("cs_agent_id")?.toString()?.trim() || null;
  const issue_category_id = formData.get("issue_category_id")?.toString()?.trim();
  const issue_description = formData.get("issue_description")?.toString()?.trim();
  const assignee_team_id = formData.get("assignee_team_id")?.toString()?.trim() || null;
  const escalation_status = formData.get("escalation_status") === "true";
  const service_request_status = formData.get("service_request_status") === "true";
  const car_plate = formData.get("car_plate")?.toString()?.trim() || null;
  const odometer = formData.get("odometer")?.toString()?.trim() || null;

  if (!booking_id || !supplier_id || !issue_category_id || !issue_description) {
    return {
      error: "Booking ID, Supplier, Issue Category, and Issue Description are required.",
    };
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      booking_id,
      supplier_id,
      cs_agent_id,
      issue_category_id,
      issue_description,
      assignee_team_id: assignee_team_id || null,
      escalation_status,
      service_request_status,
      car_plate: service_request_status ? car_plate : null,
      odometer: service_request_status ? odometer : null,
      created_by: user.id,
      status: DEFAULT_STATUS,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  return { success: true, ticketId: String(data.id) };
}

export async function saveTicket(ticketId, status, notes) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates = { status, notes: notes ?? null, updated_at: new Date().toISOString() };
  if (status === "resolved") updates.resolved_at = new Date().toISOString();
  else updates.resolved_at = null;

  const { error } = await supabase
    .from("tickets")
    .update(updates)
    .eq("id", ticketId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  return { success: true };
}
