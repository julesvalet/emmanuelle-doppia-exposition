import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'

export type SavedAddress = {
  id: string
  address: string
  postalCode: string
  city: string
  country: string
  floor: string
  doorName: string
}

export type AddressInput = Omit<SavedAddress, 'id'>

type AddressRow = {
  id: string
  adresse: string
  code_postal: string
  ville: string
  pays: string
  etage: string | null
  nom_porte: string | null
}

function fromRow(row: AddressRow): SavedAddress {
  return {
    id: row.id,
    address: row.adresse,
    postalCode: row.code_postal,
    city: row.ville,
    country: row.pays,
    floor: row.etage ?? '',
    doorName: row.nom_porte ?? '',
  }
}

function toRow(input: AddressInput) {
  return {
    adresse: input.address,
    code_postal: input.postalCode,
    ville: input.city,
    pays: input.country,
    etage: input.floor || null,
    nom_porte: input.doorName || null,
  }
}

// Shared by the account panel (full management) and the checkout shipping step (pick or add
// one) — both read/write through the same "adresses" table, RLS-scoped to the signed-in user.
export function useAddresses() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setAddresses([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('adresses')
      .select('id, adresse, code_postal, ville, pays, etage, nom_porte')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('useAddresses: failed to load addresses', error)
      return
    }
    setAddresses((data ?? []).map(fromRow))
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addAddress = useCallback(async (input: AddressInput): Promise<{ error: string | null }> => {
    if (!supabase || !user) return { error: 'not-configured' }
    const { error } = await supabase.from('adresses').insert({ user_id: user.id, ...toRow(input) })
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }, [user, refresh])

  const updateAddress = useCallback(async (id: string, input: AddressInput): Promise<{ error: string | null }> => {
    if (!supabase) return { error: 'not-configured' }
    const { error } = await supabase.from('adresses').update(toRow(input)).eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }, [refresh])

  const deleteAddress = useCallback(async (id: string): Promise<{ error: string | null }> => {
    if (!supabase) return { error: 'not-configured' }
    const { error } = await supabase.from('adresses').delete().eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }, [refresh])

  return { addresses, loading, refresh, addAddress, updateAddress, deleteAddress }
}
