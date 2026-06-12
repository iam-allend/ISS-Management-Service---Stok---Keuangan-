"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Edit2, Plus, Trash2, MessageCircle, Phone, CheckCircle, Clock, Package, Wrench, Loader2, X, Search, Save, Calendar, User, Smartphone } from "lucide-react";
import { cn, formatDate, formatRupiah, STATUS_LABEL, STATUS_COLOR, TIPE_LABEL, getDurasiConfig, getGaransiStatus, todayISO } from "@/lib/utils";
import type { NotaService, ServiceStatus, ServiceType } from "@/types";
import StatusToggle from "@/components/service/StatusToggle";
import KonfirmasiPopup from "@/components/service/KonfirmasiPopup";
import { makeWALink } from "@/lib/fonte";
import { toast } from "sonner";

interface SparepartBaru {
  barang_id: string;
  grade_id: string | null;
  jumlah: number;
  nama: string;
  stok: number;
  harga: number;
  garansi_hari: number | null;
}

interface Props {
  nota: NotaService;
  items: any[];
  teknisiList: any[];
  barangList: any[];
  isAdmin: boolean;
  userId: string;
}

export default function ServiceDetailClient({ nota, items: initialItems, teknisiList, barangList, isAdmin, userId }: Props) {
  console.log("========== DEBUG SPAREPART ==========");
  console.log("barangList total:", barangList?.length);
  console.log("barangList sample:", barangList?.slice(0, 5));
  console.log("=====================================");

  const supabase = createClient();
  const router = useRouter();

  const [items, setItems] = useState(initialItems);
  const [editNota, setEditNota] = useState(false);
  const [notaForm, setNotaForm] = useState({ ...nota });
  const [savingNota, setSavingNota] = useState(false);

  // Edit item state
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<any>({});

  // Add item state — mirip ServiceBaruClient
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemTipe, setNewItemTipe] = useState<ServiceType>("mesin");
  const [newItem, setNewItem] = useState({
    teknisi_id: "",
    jenis_kerusakan: "",
    keterangan: "",
    biaya: 0,
  });
  const [newItemSpareparts, setNewItemSpareparts] = useState<SparepartBaru[]>([]);
  const [newSpSearch, setNewSpSearch] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  // Sparepart search untuk item yang sudah ada
  const [sparepartSearch, setSparepartSearch] = useState<Record<string, string>>({});
  const [savingSparepart, setSavingSparepart] = useState<string | null>(null);

  // Konfirmasi popup
  const [konfirmasiItem, setKonfirmasiItem] = useState<any>(null);

  // Delete confirm
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteSparepartId, setDeleteSparepartId] = useState<string | null>(null);

  // ─── REFRESH ────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("item_service")
      .select(
        `
        *,
        teknisi:teknisi_id(id, nama, kode_teknisi, no_wa),
        item_sparepart(
          *,
          barang:barang_id(kode, nama),
          grade:grade_id(nama, garansi_hari)
        )
      `,
      )
      .eq("nota_id", nota.id)
      .order("created_at");
    if (data) setItems(data);
  }, [supabase, nota.id]);

  // ─── SAVE NOTA ──────────────────────────────────────────────
  const handleSaveNota = async () => {
    setSavingNota(true);
    const { error } = await supabase
      .from("nota_service")
      .update({
        no_nota: notaForm.no_nota,
        tanggal_masuk: notaForm.tanggal_masuk,
        nama_customer: notaForm.nama_customer,
        no_wa: notaForm.no_wa,
        tipe_hp: notaForm.tipe_hp,
        catatan_nota: notaForm.catatan_nota,
      })
      .eq("id", nota.id);
    if (error) toast.error("Gagal update nota", { description: error.message });
    else {
      toast.success("Nota diperbarui");
      setEditNota(false);
    }
    setSavingNota(false);
  };

  // ─── STATUS CHANGE ──────────────────────────────────────────
  const handleStatusChange = async (itemId: string, newStatus: ServiceStatus) => {
    const { error } = await supabase.rpc("update_item_service_status", {
      p_item_id: itemId,
      p_status: newStatus,
      p_user_id: userId,
    });
    if (error) {
      toast.error("Gagal update status", { description: error.message });
      return;
    }
    toast.success("Status diperbarui");
    refresh();
  };

  // ─── SAVE EDIT ITEM ─────────────────────────────────────────
  const handleSaveItem = async (itemId: string) => {
    if (!itemForm.jenis_kerusakan?.trim()) {
      toast.error("Jenis kerusakan wajib diisi");
      return;
    }
    setSavingItem(true);
    const { error } = await supabase
      .from("item_service")
      .update({
        teknisi_id: itemForm.teknisi_id || null,
        jenis_kerusakan: itemForm.jenis_kerusakan,
        keterangan: itemForm.keterangan || null,
        biaya: itemForm.biaya,
      })
      .eq("id", itemId);
    if (error) toast.error("Gagal update item", { description: error.message });
    else {
      toast.success("Item diperbarui");
      setEditItemId(null);
    }
    setSavingItem(false);
    refresh();
  };

  // ─── ADD NEW ITEM (dengan sparepart jika interface) ─────────
  const handleAddItem = async () => {
    if (!newItem.jenis_kerusakan.trim()) {
      toast.error("Jenis kerusakan wajib diisi");
      return;
    }
    if (newItemTipe === "interface" && newItemSpareparts.length === 0) {
      toast.error("Tambah minimal 1 sparepart untuk service interface");
      return;
    }
    setSavingItem(true);
    try {
      // 1. Insert item_service
      const { data: itemService, error: itemErr } = await supabase
        .from("item_service")
        .insert({
          nota_id: nota.id,
          tipe: newItemTipe,
          teknisi_id: newItem.teknisi_id || null,
          jenis_kerusakan: newItem.jenis_kerusakan,
          keterangan: newItem.keterangan || null,
          biaya: newItem.biaya,
          status: "pengecekan",
          garansi_hari: newItemTipe === "mesin" ? 30 : null,
        })
        .select()
        .single();
      if (itemErr) throw itemErr;

      // 2. Insert spareparts (jika interface)
      for (const sp of newItemSpareparts) {
        const { error: spErr } = await supabase.rpc("tambah_sparepart_service", {
          p_item_service_id: itemService.id,
          p_barang_id: sp.barang_id,
          p_grade_id: sp.grade_id,
          p_jumlah: sp.jumlah,
          p_created_by: userId,
        });
        if (spErr) throw spErr;
      }

      // 3. Update garansi dari sparepart terpanjang
      if (newItemTipe === "interface" && newItemSpareparts.length > 0) {
        const maxGaransi = Math.max(...newItemSpareparts.map((s) => s.garansi_hari || 30));
        await supabase.from("item_service").update({ garansi_hari: maxGaransi }).eq("id", itemService.id);
      }

      toast.success("Item service ditambahkan");
      setShowAddItem(false);
      setNewItem({ teknisi_id: "", jenis_kerusakan: "", keterangan: "", biaya: 0 });
      setNewItemSpareparts([]);
      setNewSpSearch("");
      refresh();
    } catch (e: any) {
      toast.error("Gagal tambah item", { description: e.message });
    } finally {
      setSavingItem(false);
    }
  };

  // ─── SPAREPART HELPER untuk form tambah item baru ───────────
  const addNewItemSparepart = (barang: any) => {
    const alreadyExists = newItemSpareparts.some((s) => s.barang_id === barang.id);
    if (alreadyExists) {
      toast.error("Sparepart sudah ditambahkan");
      return;
    }
    setNewItemSpareparts((prev) => [
      ...prev,
      {
        barang_id: barang.id,
        grade_id: barang.grade_id || null,
        jumlah: 1,
        nama: barang.nama,
        stok: barang.stok,
        harga: barang.harga_jual,
        garansi_hari: barang.garansi_hari,
      },
    ]);
    setNewSpSearch("");
  };

  const removeNewItemSparepart = (barangId: string) => {
    setNewItemSpareparts((prev) => prev.filter((s) => s.barang_id !== barangId));
  };

  const updateNewItemSparepartJumlah = (barangId: string, jumlah: number) => {
    setNewItemSpareparts((prev) => prev.map((s) => (s.barang_id === barangId ? { ...s, jumlah } : s)));
  };

  const newSpFiltered = barangList
    .filter((b) => {
      const q = newSpSearch.toLowerCase();

      const match = q && (b.nama?.toLowerCase().includes(q) || b.kode?.toLowerCase().includes(q)) && !newItemSpareparts.some((s) => s.barang_id === b.id);

      return match;
    })
    .slice(0, 6);

  console.log("search:", newSpSearch);
  console.log("filtered:", newSpFiltered);

  // ─── ADD SPAREPART ke item yang sudah ada ───────────────────
  const handleAddSparepart = async (itemId: string, barang: any) => {
    setSavingSparepart(itemId);
    const { error } = await supabase.rpc("tambah_sparepart_service", {
      p_item_service_id: itemId,
      p_barang_id: barang.id,
      p_grade_id: barang.grade_id || null,
      p_jumlah: 1,
      p_created_by: userId,
    });
    if (error) toast.error("Gagal tambah sparepart", { description: error.message });
    else {
      toast.success("Sparepart ditambahkan");
      setSparepartSearch((prev) => ({ ...prev, [itemId]: "" }));
    }
    setSavingSparepart(null);
    refresh();
  };

  // ─── DELETE SPAREPART — FIX: hapus stok_keluar manual ───────
  const handleDeleteSparepart = async (sparepartId: string) => {
    try {
      // 1. Ambil data sparepart dulu untuk dapat stok_keluar_id
      const { data: sp, error: fetchErr } = await supabase.from("item_sparepart").select("id, stok_keluar_id, barang_id, jumlah").eq("id", sparepartId).single();

      if (fetchErr || !sp) throw new Error("Sparepart tidak ditemukan");

      // 2. Hapus record item_sparepart
      const { error: delSpErr } = await supabase.from("item_sparepart").delete().eq("id", sparepartId);
      if (delSpErr) throw delSpErr;

      // 3. Hapus stok_keluar — trigger DB otomatis kembalikan stok barang
      if (sp.stok_keluar_id) {
        const { error: delSkErr } = await supabase.from("stok_keluar").delete().eq("id", sp.stok_keluar_id);
        if (delSkErr) throw delSkErr;
      } else {
        // Fallback: kembalikan stok manual kalau stok_keluar_id null
        const { data: barang } = await supabase.from("barang").select("stok").eq("id", sp.barang_id).single();
        if (barang) {
          await supabase
            .from("barang")
            .update({ stok: barang.stok + sp.jumlah })
            .eq("id", sp.barang_id);
        }
      }

      toast.success("Sparepart dihapus, stok dikembalikan");
    } catch (e: any) {
      toast.error("Gagal hapus sparepart", { description: e.message });
    }
    setDeleteSparepartId(null);
    refresh();
  };

  // ─── DELETE ITEM (hapus semua sparepartnya dulu) ─────────────
  const handleDeleteItem = async (itemId: string) => {
    try {
      // 1. Ambil semua sparepart milik item ini
      const { data: spareParts } = await supabase.from("item_sparepart").select("id, stok_keluar_id, barang_id, jumlah").eq("item_service_id", itemId);

      // 2. Hapus tiap sparepart + stok_keluar-nya
      for (const sp of spareParts || []) {
        await supabase.from("item_sparepart").delete().eq("id", sp.id);
        if (sp.stok_keluar_id) {
          await supabase.from("stok_keluar").delete().eq("id", sp.stok_keluar_id);
        } else if (sp.barang_id) {
          const { data: barang } = await supabase.from("barang").select("stok").eq("id", sp.barang_id).single();
          if (barang) {
            await supabase
              .from("barang")
              .update({ stok: barang.stok + sp.jumlah })
              .eq("id", sp.barang_id);
          }
        }
      }

      // 3. Hapus item_service
      const { error } = await supabase.from("item_service").delete().eq("id", itemId);
      if (error) throw error;

      toast.success("Item service dihapus, stok sparepart dikembalikan");
    } catch (e: any) {
      toast.error("Gagal hapus item", { description: e.message });
    }
    setDeleteItemId(null);
    refresh();
  };

  // ─── MARK DIAMBIL ────────────────────────────────────────────
  const handleMarkDiambil = async () => {
    for (const item of items) {
      if (item.status !== "diambil" && item.status !== "cancel") {
        await supabase.rpc("update_item_service_status", {
          p_item_id: item.id,
          p_status: "diambil",
          p_user_id: userId,
        });
      }
    }
    await supabase.from("nota_service").update({ status_ambil: true, tanggal_ambil: todayISO() }).eq("id", nota.id);
    toast.success("Unit telah diambil");
    router.refresh();
    refresh();
  };

  const totalBiaya = items.reduce((sum: number, i: any) => sum + (i.biaya || 0), 0);
  const hariMasuk = Math.floor((Date.now() - new Date(nota.tanggal_masuk).getTime()) / 86400000);
  const durasi = getDurasiConfig(hariMasuk);
  const allSelesai = items.every((i: any) => i.status === "selesai" || i.status === "diambil" || i.status === "cancel");

  const buildKonfirmasiData = (item: any) =>
    ({
      item_id: item.id,
      nota_id: nota.id,
      no_nota: nota.no_nota,
      nama_customer: nota.nama_customer,
      no_wa: nota.no_wa,
      tipe_hp: nota.tipe_hp,
      tipe_service: item.tipe,
      jenis_kerusakan: item.jenis_kerusakan,
      biaya: item.biaya,
      status: item.status,
      garansi_hari: item.garansi_hari,
      garansi_mulai: item.garansi_mulai,
      kode_teknisi: item.teknisi?.kode_teknisi,
      status_ambil: nota.status_ambil,
      tanggal_masuk: nota.tanggal_masuk,
    }) as any;

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{nota.no_nota}</h1>
          <p className="text-sm text-gray-500">Detail Nota Service</p>
        </div>
        {nota.status_ambil ? (
          <span className="flex items-center gap-1.5 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
            <CheckCircle className="w-4 h-4" /> Sudah Diambil
          </span>
        ) : (
          <span className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium", durasi.bgColor, durasi.color)}>
            <Clock className="w-3.5 h-3.5" /> {durasi.label}
          </span>
        )}
      </div>

      {/* ── Info Customer ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 text-sm">Data Customer & Unit</h2>
          {isAdmin && !editNota && (
            <button onClick={() => setEditNota(true)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {editNota ? (
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "no_nota", label: "No. Nota", type: "text" },
                { key: "tanggal_masuk", label: "Tgl Masuk", type: "date" },
                { key: "nama_customer", label: "Nama Customer", type: "text" },
                { key: "no_wa", label: "No. WA", type: "tel" },
                { key: "tipe_hp", label: "Tipe HP", type: "text", colSpan: 2 },
              ] as any[]
            ).map((field) => (
              <div key={field.key} className={field.colSpan === 2 ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={(notaForm as any)[field.key] || ""}
                  onChange={(e) => setNotaForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                value={notaForm.catatan_nota || ""}
                onChange={(e) => setNotaForm((prev) => ({ ...prev, catatan_nota: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500 resize-none"
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button onClick={() => setEditNota(false)} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-500 text-sm hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleSaveNota} disabled={savingNota} className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {savingNota && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Save className="w-3.5 h-3.5" /> Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Customer
              </p>
              <p className="font-medium text-gray-800 mt-0.5">{nota.nama_customer}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Unit
              </p>
              <p className="font-medium text-gray-800 mt-0.5">{nota.tipe_hp}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tgl Masuk
              </p>
              <p className="font-medium text-gray-800 mt-0.5">{formatDate(nota.tanggal_masuk)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> No. WA
              </p>
              <a href={makeWALink(nota.no_wa)} target="_blank" rel="noopener noreferrer" className="font-medium text-green-600 hover:underline mt-0.5 block">
                {nota.no_wa}
              </a>
            </div>
            {nota.catatan_nota && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400">Catatan</p>
                <p className="text-gray-600 text-sm mt-0.5">{nota.catatan_nota}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Item Service List ── */}
      {items.map((item: any) => {
        const isEditing = editItemId === item.id;
        const garansi = getGaransiStatus(item.garansi_mulai, item.garansi_hari);
        const spSearch = sparepartSearch[item.id] || "";
        const spFiltered = barangList.filter((b) => spSearch && (b.nama.toLowerCase().includes(spSearch.toLowerCase()) || b.kode.toLowerCase().includes(spSearch.toLowerCase()))).slice(0, 5);

        return (
          <div key={item.id} className={cn("bg-white rounded-xl border p-5 space-y-4", item.tipe === "mesin" ? "border-purple-100" : "border-blue-100")}>
            {/* item header */}
            <div className="flex items-center justify-between">
              <span className={cn("flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full", item.tipe === "mesin" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700")}>
                {item.tipe === "mesin" ? <Wrench className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                {TIPE_LABEL[item.tipe as ServiceType]}
              </span>

              <div className="flex items-center gap-2">
                <StatusToggle currentStatus={item.status} itemId={item.id} onChange={handleStatusChange} disabled={!isAdmin} />
                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditItemId(item.id);
                        setItemForm({ ...item });
                      }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {item.status === "selesai" && (
                      <button onClick={() => setKonfirmasiItem(buildKonfirmasiData(item))} title="Konfirmasi selesai ke customer" className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setDeleteItemId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Mode Edit Item ── */}
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Kerusakan *</label>
                    <input
                      value={itemForm.jenis_kerusakan || ""}
                      onChange={(e) => setItemForm((p: any) => ({ ...p, jenis_kerusakan: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Teknisi</label>
                    <select
                      value={itemForm.teknisi_id || ""}
                      onChange={(e) => setItemForm((p: any) => ({ ...p, teknisi_id: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
                    >
                      <option value="">— Pilih —</option>
                      {teknisiList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nama} {t.kode_teknisi ? `(${t.kode_teknisi})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Biaya</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={itemForm.biaya || 0}
                        onChange={(e) => setItemForm((p: any) => ({ ...p, biaya: Number(e.target.value) }))}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan</label>
                    <textarea
                      value={itemForm.keterangan || ""}
                      onChange={(e) => setItemForm((p: any) => ({ ...p, keterangan: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditItemId(null)} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-500 text-sm hover:bg-gray-50">
                    Batal
                  </button>
                  <button onClick={() => handleSaveItem(item.id)} disabled={savingItem} className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingItem && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Simpan
                  </button>
                </div>
              </div>
            ) : (
              /* ── Mode View Item ── */
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-400">Kerusakan</p>
                    <p className="font-medium text-gray-800">{item.jenis_kerusakan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Teknisi</p>
                    <p className="font-medium text-gray-800">{item.teknisi ? `${item.teknisi.nama} (${item.teknisi.kode_teknisi || "-"})` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Biaya</p>
                    <p className="font-bold text-gray-900">{formatRupiah(item.biaya)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Garansi</p>
                    <p className={cn("text-xs font-medium", garansi.color)}>{item.garansi_mulai ? garansi.label : item.garansi_hari ? `${item.garansi_hari} hari (setelah diambil)` : "—"}</p>
                  </div>
                  {item.keterangan && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Keterangan</p>
                      <p className="text-gray-600">{item.keterangan}</p>
                    </div>
                  )}
                </div>

                {/* Sparepart list */}
                {item.item_sparepart?.length > 0 && (
                  <div className="pt-3 border-t border-gray-50 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Sparepart Dipakai</p>
                    {item.item_sparepart.map((sp: any) => (
                      <div key={sp.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 text-xs">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{sp.barang?.nama}</p>
                          <p className="text-gray-400">
                            {sp.grade?.nama || "-"} · Garansi: {sp.garansi_hari ? `${sp.garansi_hari}h` : "-"} · x{sp.jumlah}
                          </p>
                        </div>
                        {isAdmin && (
                          <button onClick={() => setDeleteSparepartId(sp.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tambah sparepart ke item yang sudah ada (interface only) */}
                {isAdmin && item.tipe === "interface" && !nota.status_ambil && (
                  <div className="relative pt-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        value={spSearch}
                        onChange={(e) =>
                          setSparepartSearch((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="+ Tambah sparepart..."
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-dashed border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500 focus:border-solid"
                      />
                    </div>
                    {spFiltered.length > 0 && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg border border-gray-100 shadow-lg z-10">
                        {spFiltered.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleAddSparepart(item.id, b)}
                            disabled={savingSparepart === item.id}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0 text-xs transition"
                          >
                            <p className="font-medium text-gray-800">{b.nama}</p>
                            <p className="text-gray-400">
                              {b.grade_nama || "-"} · Stok: {b.stok} · {formatRupiah(b.harga_jual)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Tambah Item Baru ── */}
      {isAdmin && !nota.status_ambil && (
        <>
          {!showAddItem ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNewItemTipe("mesin");
                  setNewItemSpareparts([]);
                  setShowAddItem(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-purple-200 text-purple-600 hover:bg-purple-50 text-sm transition"
              >
                <Plus className="w-4 h-4" /> + Service Mesin
              </button>
              <button
                onClick={() => {
                  setNewItemTipe("interface");
                  setNewItemSpareparts([]);
                  setShowAddItem(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 text-sm transition"
              >
                <Plus className="w-4 h-4" /> + Ganti Sparepart
              </button>
            </div>
          ) : (
            <div className={cn("bg-white rounded-xl border p-5 space-y-4", newItemTipe === "mesin" ? "border-purple-200" : "border-blue-200")}>
              {/* form header */}
              <div className="flex items-center justify-between">
                <span className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", newItemTipe === "mesin" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700")}>
                  {newItemTipe === "mesin" ? <Wrench className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                  Tambah {newItemTipe === "mesin" ? "Service Mesin" : "Ganti Sparepart"}
                  {newItemTipe === "mesin" && <span className="opacity-60 ml-1">· Garansi 1 bulan</span>}
                </span>
                <button
                  onClick={() => {
                    setShowAddItem(false);
                    setNewItemSpareparts([]);
                    setNewSpSearch("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Kerusakan *</label>
                  <input
                    value={newItem.jenis_kerusakan}
                    onChange={(e) => setNewItem((p) => ({ ...p, jenis_kerusakan: e.target.value }))}
                    placeholder="misal: LCD pecah, baterai drop"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Teknisi</label>
                  <select
                    value={newItem.teknisi_id}
                    onChange={(e) => setNewItem((p) => ({ ...p, teknisi_id: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
                  >
                    <option value="">— Pilih —</option>
                    {teknisiList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama} {t.kode_teknisi ? `(${t.kode_teknisi})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Biaya</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={newItem.biaya}
                      onChange={(e) => setNewItem((p) => ({ ...p, biaya: Number(e.target.value) }))}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan</label>
                  <textarea
                    value={newItem.keterangan}
                    onChange={(e) => setNewItem((p) => ({ ...p, keterangan: e.target.value }))}
                    rows={2}
                    placeholder="Detail kondisi, catatan perbaikan..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500 resize-none"
                  />
                </div>
              </div>

              {/* Sparepart section — hanya untuk interface */}
              {newItemTipe === "interface" && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-700">
                    Sparepart yang dipakai
                    <span className="text-red-500 ml-1">*</span>
                  </p>

                  {/* list sparepart yang sudah dipilih */}
                  {newItemSpareparts.map((sp) => (
                    <div key={sp.barang_id} className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800">{sp.nama}</p>
                        <p className="text-xs text-gray-400">
                          Garansi: {sp.garansi_hari ? `${sp.garansi_hari} hari` : "-"} · Stok: {sp.stok} · {formatRupiah(sp.harga)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={sp.jumlah}
                          onChange={(e) => updateNewItemSparepartJumlah(sp.barang_id, Number(e.target.value))}
                          className="w-14 px-2 py-1 text-xs rounded border border-gray-200 text-center focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-500"
                        />
                        <button onClick={() => removeNewItemSparepart(sp.barang_id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* search sparepart */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={newSpSearch}
                      onChange={(e) => setNewSpSearch(e.target.value)}
                      placeholder="Cari sparepart untuk ditambahkan..."
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-dashed border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500 focus:border-solid"
                    />
                    {newSpFiltered.length > 0 && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg border border-gray-100 shadow-lg z-10 overflow-hidden">
                        {newSpFiltered.map((b) => (
                          <button key={b.id} type="button" onClick={() => addNewItemSparepart(b)} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition">
                            <p className="text-xs font-medium text-gray-800">{b.nama}</p>
                            <p className="text-xs text-gray-400">
                              {b.grade_nama || "-"} · Stok: {b.stok} · {formatRupiah(b.harga_jual)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowAddItem(false);
                    setNewItemSpareparts([]);
                    setNewSpSearch("");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-500 text-sm hover:bg-gray-50"
                >
                  Batal
                </button>
                <button onClick={handleAddItem} disabled={savingItem} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingItem && <Loader2 className="w-4 h-4 animate-spin" />}
                  Tambah Item
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Footer total & diambil ── */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Total Biaya</span>
            <span className="text-lg font-bold text-gray-900">{formatRupiah(totalBiaya)}</span>
          </div>
          {isAdmin && !nota.status_ambil && allSelesai && (
            <button onClick={handleMarkDiambil} className="w-full py-3 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Tandai Unit Sudah Diambil
            </button>
          )}
          {nota.status_ambil && nota.tanggal_ambil && <p className="text-center text-sm text-green-600">✓ Unit diambil pada {formatDate(nota.tanggal_ambil)}</p>}
        </div>
      )}

      {/* ── Konfirmasi Popup ── */}
      {konfirmasiItem && (
        <KonfirmasiPopup
          item={konfirmasiItem}
          onClose={() => setKonfirmasiItem(null)}
          onSent={() => {
            setKonfirmasiItem(null);
            refresh();
          }}
        />
      )}

      {/* ── Delete Item Confirm ── */}
      {deleteItemId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold mb-2">Hapus item service?</h3>
            <p className="text-sm text-gray-500 mb-1">Data service ini akan dihapus permanen.</p>
            <p className="text-xs text-orange-600 bg-orange-50 p-2.5 rounded-lg mb-5">⚠️ Semua sparepart yang dipakai akan dikembalikan ke stok otomatis.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteItemId(null)} className="flex-1 py-2 rounded-lg border text-sm hover:bg-gray-50">
                Batal
              </button>
              <button onClick={() => handleDeleteItem(deleteItemId)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Sparepart Confirm ── */}
      {deleteSparepartId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold mb-2">Hapus sparepart ini?</h3>
            <p className="text-sm text-gray-500 mb-5">Stok barang akan dikembalikan dan data stok keluar ikut terhapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSparepartId(null)} className="flex-1 py-2 rounded-lg border text-sm hover:bg-gray-50">
                Batal
              </button>
              <button onClick={() => handleDeleteSparepart(deleteSparepartId)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
