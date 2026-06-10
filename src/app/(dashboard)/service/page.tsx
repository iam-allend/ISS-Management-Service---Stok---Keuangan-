import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ServiceClient from "./ServiceClient";

export default async function ServicePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: services }, { data: teknisiList }, { data: profile }] = await Promise.all([
    supabase.from("v_service_lengkap").select("*").order("tanggal_masuk", { ascending: false }).limit(200),
    supabase.from("profiles").select("id, nama, kode_teknisi").eq("role", "teknisi").eq("aktif", true).order("nama"),
    supabase.from("profiles").select("role, id").eq("id", user.id).single(),
  ]);

  return <ServiceClient initialData={services ?? []} teknisiList={teknisiList ?? []} currentProfile={profile} />;
}
