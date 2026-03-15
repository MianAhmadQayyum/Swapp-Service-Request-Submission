"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Reusable revalidate helper for ticket flows
export function revalidateDashboard() {
  revalidatePath("/dashboard");
}

export function revalidateTickets() {
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard");
}
