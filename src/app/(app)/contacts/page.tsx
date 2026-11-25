import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactsClient } from "@/components/contacts/ContactsClient";
import type { Contact, Loan } from "@/types/database";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: contactsRaw }, { data: loansRaw }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("loans")
      .select("id, contact_id, type, remaining_amount, item_name, status")
      .eq("user_id", user.id),
  ]);

  return (
    <ContactsClient
      userId={user.id}
      initialContacts={(contactsRaw ?? []) as Contact[]}
      loans={
        (loansRaw ?? []) as Pick<
          Loan,
          "id" | "contact_id" | "type" | "remaining_amount" | "item_name" | "status"
        >[]
      }
    />
  );
}
