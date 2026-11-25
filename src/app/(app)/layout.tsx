import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", user.id)
    .single();

  const profile = profileData ?? {
    id: user.id,
    full_name:
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Pengguna",
    email: user.email ?? "",
  };

  return <AppShell profile={profile}>{children}</AppShell>;
}
