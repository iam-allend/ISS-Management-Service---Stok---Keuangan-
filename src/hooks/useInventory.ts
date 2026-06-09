'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BarangLengkap, Kategori, Grade } from '@/types'

export function useInventory() {
  const supabase = createClient()
  const [barang, setBarang] = useState<BarangLengkap[]>([])
  const [kategori, setKategori] = useState<Kategori[]>([])
  const [grade, setGrade] = useState<Grade[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBarang = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('v_barang_lengkap').select('*').eq('aktif', true).order('nama')
    if (data) setBarang(data as BarangLengkap[])
    setLoading(false)
  }, [supabase])

  const fetchKategori = useCallback(async () => {
    const { data } = await supabase.from('kategori').select('*').eq('aktif', true).order('nama')
    if (data) setKategori(data as Kategori[])
  }, [supabase])

  const fetchGrade = useCallback(async () => {
    const { data } = await supabase.from('grade').select('*').eq('aktif', true).order('nama')
    if (data) setGrade(data as Grade[])
  }, [supabase])

  useEffect(() => {
    fetchBarang()
    fetchKategori()
    fetchGrade()
  }, [fetchBarang, fetchKategori, fetchGrade])

  return { barang, kategori, grade, loading, refresh: fetchBarang }
}