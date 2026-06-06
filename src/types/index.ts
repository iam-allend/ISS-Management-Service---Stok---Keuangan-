// ============================================================
// iPhone Service Solution — TypeScript Types
// ============================================================

// --- ENUMS ---

export type UserRole = 'super_admin' | 'admin' | 'teknisi'
export type ServiceType = 'mesin' | 'interface'
export type ServiceStatus = 'pengecekan' | 'proses_service' | 'selesai' | 'diambil' | 'cancel'
export type NotifType = 'warning_3hari' | 'eskalasi_4hari' | 'selesai_konfirmasi' | 'custom'

// --- DATABASE MODELS ---

export interface Profile {
  id: string
  nama: string
  kode_teknisi: string | null
  role: UserRole
  no_wa: string | null
  aktif: boolean
  created_at: string
  updated_at: string
}

export interface Kategori {
  id: string
  nama: string
  deskripsi: string | null
  aktif: boolean
  created_at: string
}

export interface Grade {
  id: string
  nama: string
  garansi_hari: number
  deskripsi: string | null
  aktif: boolean
  created_at: string
}

export interface KategoriGrade {
  id: string
  kategori_id: string
  grade_id: string
}

export interface Barang {
  id: string
  kode: string
  nama: string
  merk: string | null
  kategori_id: string | null
  grade_id: string | null
  harga_jual: number
  stok: number
  stok_min: number
  deskripsi: string | null
  aktif: boolean
  created_at: string
  updated_at: string
}

export interface StokMasuk {
  id: string
  barang_id: string
  tanggal: string
  jumlah: number
  harga_beli: number | null
  supplier: string | null
  keterangan: string | null
  created_by: string | null
  created_at: string
}

export interface StokKeluar {
  id: string
  barang_id: string
  tanggal: string
  jumlah: number
  keterangan: string | null
  item_service_id: string | null
  created_by: string | null
  created_at: string
}

export interface StokOpname {
  id: string
  tanggal: string
  barang_id: string
  stok_sistem: number
  stok_fisik: number
  selisih: number
  keterangan: string | null
  petugas_id: string | null
  created_at: string
}

export interface NotaService {
  id: string
  no_nota: string
  tanggal_masuk: string
  nama_customer: string
  no_wa: string
  tipe_hp: string
  status_ambil: boolean
  tanggal_ambil: string | null
  catatan_nota: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ItemService {
  id: string
  nota_id: string
  tipe: ServiceType
  teknisi_id: string | null
  jenis_kerusakan: string
  keterangan: string | null
  biaya: number
  status: ServiceStatus
  garansi_hari: number | null
  garansi_mulai: string | null
  notif_3hari_sent: boolean
  notif_4hari_sent: boolean
  notif_selesai_sent: boolean
  tanggal_selesai: string | null
  created_at: string
  updated_at: string
}

export interface ItemSparepart {
  id: string
  item_service_id: string
  barang_id: string
  grade_id: string | null
  jumlah: number
  harga_satuan: number | null
  garansi_hari: number | null
  stok_keluar_id: string | null
  created_at: string
}

export interface NotifikasiLog {
  id: string
  item_service_id: string | null
  nota_id: string | null
  tipe: NotifType
  tujuan_wa: string
  pesan: string
  status_kirim: string
  response_api: Record<string, unknown> | null
  created_at: string
}

// --- EXTENDED / JOIN TYPES ---

export interface BarangLengkap extends Barang {
  kategori_nama: string | null
  grade_nama: string | null
  garansi_hari: number | null
  stok_rendah: boolean
}

export interface KategoriWithGrades extends Kategori {
  grades: Grade[]
}

export interface StokMasukLengkap extends StokMasuk {
  barang: Pick<BarangLengkap, 'kode' | 'nama' | 'merk' | 'kategori_nama' | 'grade_nama' | 'stok'>
  petugas?: Pick<Profile, 'nama' | 'kode_teknisi'>
}

export interface StokKeluarLengkap extends StokKeluar {
  barang: Pick<BarangLengkap, 'kode' | 'nama' | 'merk' | 'kategori_nama' | 'grade_nama' | 'stok'>
  petugas?: Pick<Profile, 'nama' | 'kode_teknisi'>
}

export interface ItemSparepartLengkap extends ItemSparepart {
  barang: Pick<BarangLengkap, 'kode' | 'nama' | 'merk' | 'kategori_nama'>
  grade: Pick<Grade, 'nama' | 'garansi_hari'> | null
}

export interface ItemServiceLengkap extends ItemService {
  teknisi: Pick<Profile, 'nama' | 'kode_teknisi' | 'no_wa'> | null
  spareparts: ItemSparepartLengkap[]
  garansi_sampai: string | null
  hari_berlalu: number
}

export interface NotaServiceLengkap extends NotaService {
  items: ItemServiceLengkap[]
  total_biaya: number
}

export interface ServiceLengkap {
  item_id: string
  nota_id: string
  no_nota: string
  tanggal_masuk: string
  nama_customer: string
  no_wa: string
  tipe_hp: string
  status_ambil: boolean
  tanggal_ambil: string | null
  tipe_service: ServiceType
  jenis_kerusakan: string
  keterangan: string | null
  biaya: number
  status: ServiceStatus
  garansi_hari: number | null
  garansi_mulai: string | null
  tanggal_selesai: string | null
  nama_teknisi: string | null
  kode_teknisi: string | null
  hari_berlalu: number
  garansi_sampai: string | null
}

// --- TRACKING PUBLIK ---

export interface TrackingData {
  no_nota: string
  tanggal_masuk: string
  tipe_hp: string
  status_ambil: boolean
  tanggal_ambil: string | null
  items: {
    tipe: ServiceType
    jenis_kerusakan: string
    status: ServiceStatus
    biaya: number
    garansi_hari: number | null
    garansi_mulai: string | null
    tanggal_selesai: string | null
    kode_teknisi: string | null
  }[]
}

// --- FORM TYPES ---

export interface BarangFormData {
  kode: string
  nama: string
  merk: string
  kategori_id: string
  grade_id: string
  harga_jual: number
  stok: number
  stok_min: number
  deskripsi: string
}

export interface StokMasukFormData {
  barang_id: string
  tanggal: string
  jumlah: number
  harga_beli: number
  supplier: string
  keterangan: string
}

export interface NotaServiceFormData {
  no_nota: string
  tanggal_masuk: string
  nama_customer: string
  no_wa: string
  tipe_hp: string
  catatan_nota: string
}

export interface ItemServiceFormData {
  tipe: ServiceType
  teknisi_id: string
  jenis_kerusakan: string
  keterangan: string
  biaya: number
  garansi_hari: number
  spareparts?: SparepartFormItem[]
}

export interface SparepartFormItem {
  barang_id: string
  grade_id: string
  jumlah: number
}

export interface KonfirmasiPesanData {
  no_nota: string
  nama_customer: string
  no_wa: string
  tipe_hp: string
  items: {
    tipe: ServiceType
    jenis_kerusakan: string
    biaya: number
    garansi_hari: number | null
  }[]
  total_biaya: number
  catatan: string
}

// --- FILTER TYPES ---

export interface ServiceFilter {
  search?: string
  status?: ServiceStatus | 'all'
  tipe?: ServiceType | 'all'
  teknisi_id?: string | 'all'
  tanggal_masuk_dari?: string
  tanggal_masuk_sampai?: string
  tanggal_keluar_dari?: string
  tanggal_keluar_sampai?: string
  status_ambil?: boolean | 'all'
}

export interface InventoryFilter {
  search?: string
  kategori_id?: string | 'all'
  grade_id?: string | 'all'
  stok_rendah?: boolean
  aktif?: boolean
}

export interface StokFilter {
  search?: string
  barang_id?: string
  tanggal_dari?: string
  tanggal_sampai?: string
}

// --- API RESPONSE ---

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// --- FONTE WA API ---

export interface FontePayload {
  target: string   // nomor WA tujuan format: 6281xxxxxxxx
  message: string
}

export interface FonteResponse {
  status: boolean
  message: string
}

// --- DASHBOARD ---

export interface DashboardSummary {
  total_barang: number
  barang_stok_rendah: number
  service_masuk_hari_ini: number
  service_aktif: number
  menunggu_diambil: number
  service_terlambat: number
}