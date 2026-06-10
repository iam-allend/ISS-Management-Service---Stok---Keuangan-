import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KategoriClient from "./KategoriClient";

export default async function KategoriPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  // Halaman ini hanya untuk super_admin
  if (profile?.role !== "super_admin") redirect("/");

  const [{ data: kategori }, { data: grade }] = await Promise.all([
    supabase.from("kategori").select("*, kategori_grade(grade:grade_id(id, nama, garansi_hari))").order("nama"),
    supabase.from("grade").select("*").eq("aktif", true).order("nama"),
  ]);

  const kategoriWithGrades = (kategori ?? []).map((k: any) => ({
    ...k,
    grades: (k.kategori_grade || []).map((kg: any) => kg.grade).filter(Boolean),
  }));

  return <KategoriClient initialData={kategoriWithGrades} gradeList={grade ?? []} />;
}
