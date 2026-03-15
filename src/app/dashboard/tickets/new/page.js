import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewTicketForm from "./NewTicketForm";

export default async function NewTicketPage() {
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
  const role = profile?.role ?? "customer_support";
  if (role !== "customer_support" && role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-6">
        New service request
      </h2>
      <NewTicketForm />
      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/dashboard/tickets" className="font-medium hover:underline">
          ← Back to tickets
        </Link>
      </p>
    </div>
  );
}
