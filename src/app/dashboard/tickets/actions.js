"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTicket(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const booking_id = formData.get("booking_id")?.toString()?.trim();
  const supplierName = formData.get("supplier")?.toString()?.trim();
  const issueCategoryName = formData.get("issue_category")?.toString()?.trim();
  const description = formData.get("description")?.toString()?.trim();
  const cs_agent = formData.get("cs_agent")?.toString()?.trim() || null;
  const escalation_status = formData.get("escalation_status")?.toString()?.trim() || null;
  const service_request_opened = formData.get("service_request_opened")?.toString()?.trim() || null;
  const team_assigned = formData.get("team_assigned")?.toString()?.trim() || null;
  const number_plate = formData.get("number_plate")?.toString()?.trim() || null;
  const odometer_reading = formData.get("odometer_reading")?.toString()?.trim() || null;

  if (!booking_id || !supplierName || !issueCategoryName || !description) {
    return { error: "Booking ID, Supplier, Issue Category, and Issue Description are required." };
  }

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("name", supplierName)
    .single();
  if (!supplier) return { error: "Invalid supplier selected." };

  const { data: issueType } = await supabase
    .from("issue_types")
    .select("id")
    .eq("name", issueCategoryName)
    .single();
  if (!issueType) return { error: "Invalid issue category selected." };

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      booking_id,
      supplier_id: supplier.id,
      issue_type_id: issueType.id,
      priority: "medium",
      description,
      customer_name: null,
      cs_agent,
      escalation_status,
      service_request_opened,
      team_assigned,
      number_plate: service_request_opened === "Yes" ? number_plate : null,
      odometer_reading: service_request_opened === "Yes" ? odometer_reading : null,
      created_by: user.id,
      status: "new",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  revalidatePath(`/dashboard/tickets/${data.id}`);
  return { success: true, ticketId: String(data.id) };
}

export async function updateTicketStatus(ticketId, status) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates = { status, updated_at: new Date().toISOString() };
  if (status === "resolved") updates.resolved_at = new Date().toISOString();
  if (status === "closed") updates.closed_at = new Date().toISOString();

  const { error } = await supabase
    .from("tickets")
    .update(updates)
    .eq("id", ticketId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return { success: true };
}

export async function assignTicket(ticketId, assignedToId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tickets")
    .update({
      assigned_to: assignedToId || null,
      status: assignedToId ? "assigned" : "new",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return { success: true };
}

export async function addTicketUpdate(ticketId, comment) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const c = comment?.toString()?.trim();
  if (!c) return { error: "Comment is required." };

  const { error } = await supabase.from("ticket_updates").insert({
    ticket_id: ticketId,
    comment: c,
    added_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return { success: true };
}

export async function markSlaBreached(ticketId) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ sla_breached: true, updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .not("status", "in", '("resolved","closed")');

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return { success: true };
}
