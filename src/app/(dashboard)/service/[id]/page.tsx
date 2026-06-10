import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ServiceDetailClient from "./ServiceDetailClient";

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: nota }, { data: items }, { data: teknisiList }, { data: barangList, error: barangError }, { data: profile }] = await Promise.all([
    supabase.from("nota_service").select("*").eq("id", id).single(),

    supabase
      .from("item_service")
      .select(
        `
      *,
      teknisi:teknisi_id(
        id,
        nama,
        kode_teknisi,
        no_wa
      ),
      item_sparepart(
        *,
        barang:barang_id(
          kode,
          nama
        ),
        grade:grade_id(
          nama,
          garansi_hari
        )
      )
    `,
      )
      .eq("nota_id", id)
      .order("created_at"),

    supabase.from("profiles").select("id, nama, kode_teknisi").eq("role", "teknisi").eq("aktif", true).order("nama"),

    // GANTI BAGIAN INI
    supabase.from("v_barang_lengkap").select("*").limit(50),

    supabase.from("profiles").select("id, role").eq("id", user?.id).single(),
  ]);

  console.log("BARANG ERROR:", barangError);
  console.log("BARANG COUNT:", barangList?.length);
  console.log("BARANG SAMPLE:", barangList?.[0]);

  if (!nota) notFound();

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  return <ServiceDetailClient nota={nota} items={items ?? []} teknisiList={teknisiList ?? []} barangList={barangList ?? []} isAdmin={isAdmin} userId={profile?.id ?? ""} />;
}
