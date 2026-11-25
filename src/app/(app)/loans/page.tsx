import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoansClient } from "@/components/loans/LoansClient";
import type { LoanWithRelations } from "@/types/database";

export default async function LoansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: loansRaw } = await supabase
    .from("loans")
    .select("*, contact:contacts(id, name, whatsapp_number, note)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <LoansClient loans={(loansRaw ?? []) as LoanWithRelations[]} />;
}
