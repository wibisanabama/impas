import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactDetailClient } from "@/components/contacts/ContactDetailClient";
import type { Contact, Loan } from "@/types/database";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: contactRaw }, { data: loansRaw }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("loans")
      .select("*")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ContactDetailClient
      userId={user.id}
      initialContact={(contactRaw as Contact | null) ?? null}
      loans={(loansRaw ?? []) as Loan[]}
    />
  );
}
