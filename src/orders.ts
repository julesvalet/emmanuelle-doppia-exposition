import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'

export type OrderItem = {
  name: string
  quantity: string
  unitAmount: string
  currency: string
}

export type Order = {
  id: string
  date: string
  items: OrderItem[]
  total: number
  status: string
  paypalOrderNumber: string | null
}

type OrderRow = {
  id: string
  date_commande: string
  articles: OrderItem[] | null
  montant_total: number
  statut: string | null
  numero_paypal: string | null
}

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    date: row.date_commande,
    items: row.articles ?? [],
    total: row.montant_total,
    status: row.statut ?? '',
    paypalOrderNumber: row.numero_paypal,
  }
}

// Reads straight from "commandes" with the anon key — RLS already restricts SELECT to rows
// where user_id = auth.uid(), so this can only ever return the signed-in customer's own orders.
export function useOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setOrders([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('commandes')
      .select('id, date_commande, articles, montant_total, statut, numero_paypal')
      .order('date_commande', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('useOrders: failed to load order history', error)
      return
    }
    setOrders((data ?? []).map(fromRow))
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { orders, loading, refresh }
}
