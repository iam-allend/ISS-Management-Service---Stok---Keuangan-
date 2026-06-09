'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ServiceLengkap, ServiceFilter } from '@/types'

export function useService() {
  const supabase = createClient()
  const [services, setServices] = useState<ServiceLengkap[]>([])
  const [loading, setLoading] = useState(false)

  const fetchServices = useCallback(async (filter?: ServiceFilter) => {
    setLoading(true)
    let query = supabase
      .from('v_service_lengkap')
      .select('*')
      .order('tanggal_masuk', { ascending: false })
      .limit(300)

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }
    if (filter?.tipe && filter.tipe !== 'all') {
      query = query.eq('tipe_service', filter.tipe)
    }

    const { data } = await query
    if (data) setServices(data as ServiceLengkap[])
    setLoading(false)
  }, [supabase])

  return { services, loading, fetchServices }
}