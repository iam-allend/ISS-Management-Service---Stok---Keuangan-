import { z } from 'zod'

// ============================================================
// BARANG
// ============================================================

export const barangSchema = z.object({
  kode: z.string().min(1, 'Kode wajib diisi').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().min(1, 'Nama barang wajib diisi').max(100),
  merk: z.string().max(50).optional().default(''),
  kategori_id: z.string().uuid('Pilih kategori').optional().nullable(),
  grade_id: z.string().uuid('Pilih grade').optional().nullable(),
  harga_jual: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  stok: z.coerce.number().min(0, 'Stok tidak boleh negatif'),
  stok_min: z.coerce.number().min(0, 'Stok min tidak boleh negatif'),
  deskripsi: z.string().max(500).optional().default(''),
})

export type BarangSchema = z.infer<typeof barangSchema>

// ============================================================
// STOK MASUK
// ============================================================

export const stokMasukSchema = z.object({
  barang_id: z.string().uuid('Pilih barang'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  jumlah: z.coerce.number().min(0.001, 'Jumlah harus lebih dari 0'),
  harga_beli: z.coerce.number().min(0).optional().default(0),
  supplier: z.string().max(100).optional().default(''),
  keterangan: z.string().max(200).optional().default(''),
})

export type StokMasukSchema = z.infer<typeof stokMasukSchema>

// ============================================================
// STOK OPNAME
// ============================================================

export const stokOpnameSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  barang_id: z.string().uuid('Pilih barang'),
  stok_fisik: z.coerce.number().min(0, 'Stok fisik tidak boleh negatif'),
  keterangan: z.string().max(200).optional().default(''),
})

export type StokOpnameSchema = z.infer<typeof stokOpnameSchema>

// ============================================================
// NOTA SERVICE
// ============================================================

export const notaServiceSchema = z.object({
  no_nota: z.string().min(1, 'No nota wajib diisi').max(50),
  tanggal_masuk: z.string().min(1, 'Tanggal masuk wajib diisi'),
  nama_customer: z.string().min(1, 'Nama customer wajib diisi').max(100),
  no_wa: z.string().min(8, 'No WA tidak valid').max(20),
  tipe_hp: z.string().min(1, 'Tipe HP wajib diisi').max(100),
  catatan_nota: z.string().max(500).optional().default(''),
})

export type NotaServiceSchema = z.infer<typeof notaServiceSchema>

// ============================================================
// ITEM SERVICE — MESIN
// ============================================================

export const itemServiceMesinSchema = z.object({
  teknisi_id: z.string().uuid('Pilih teknisi').optional().nullable(),
  jenis_kerusakan: z.string().min(1, 'Jenis kerusakan wajib diisi').max(200),
  keterangan: z.string().max(500).optional().default(''),
  biaya: z.coerce.number().min(0, 'Biaya tidak boleh negatif'),
})

export type ItemServiceMesinSchema = z.infer<typeof itemServiceMesinSchema>

// ============================================================
// ITEM SERVICE — INTERFACE/SPAREPART
// ============================================================

export const sparepartItemSchema = z.object({
  barang_id: z.string().uuid('Pilih barang'),
  grade_id: z.string().uuid('Pilih grade').optional().nullable(),
  jumlah: z.coerce.number().min(0.001, 'Jumlah harus lebih dari 0'),
})

export const itemServiceInterfaceSchema = z.object({
  teknisi_id: z.string().uuid('Pilih teknisi').optional().nullable(),
  jenis_kerusakan: z.string().min(1, 'Jenis kerusakan wajib diisi').max(200),
  keterangan: z.string().max(500).optional().default(''),
  biaya: z.coerce.number().min(0),
  spareparts: z.array(sparepartItemSchema).min(1, 'Minimal 1 sparepart'),
})

export type ItemServiceInterfaceSchema = z.infer<typeof itemServiceInterfaceSchema>

// ============================================================
// KATEGORI
// ============================================================

export const kategoriSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi').max(50),
  deskripsi: z.string().max(200).optional().default(''),
  grade_ids: z.array(z.string().uuid()).min(1, 'Pilih minimal 1 grade'),
})

export type KategoriSchema = z.infer<typeof kategoriSchema>

// ============================================================
// GRADE
// ============================================================

export const gradeSchema = z.object({
  nama: z.string().min(1, 'Nama grade wajib diisi').max(50),
  garansi_hari: z.coerce.number().min(1, 'Garansi minimal 1 hari'),
  deskripsi: z.string().max(200).optional().default(''),
})

export type GradeSchema = z.infer<typeof gradeSchema>

// ============================================================
// USER / PROFILE
// ============================================================

export const profileSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi').max(100),
  kode_teknisi: z.string().max(10).optional().nullable(),
  role: z.enum(['super_admin', 'admin', 'teknisi']),
  no_wa: z.string().max(20).optional().nullable(),
  aktif: z.boolean().default(true),
})

export const createUserSchema = profileSchema.extend({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

export type ProfileSchema = z.infer<typeof profileSchema>
export type CreateUserSchema = z.infer<typeof createUserSchema>

// ============================================================
// KONFIRMASI PESAN
// ============================================================

export const konfirmasiPesanSchema = z.object({
  pesan: z.string().min(1, 'Pesan tidak boleh kosong'),
  catatan: z.string().max(200).optional().default(''),
})

export type KonfirmasiPesanSchema = z.infer<typeof konfirmasiPesanSchema>