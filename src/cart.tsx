/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { LocalizedText } from './data/catalogue'

const STORAGE_KEY = 'emmanuelle-doppia-cart'
const MAX_QUANTITY = 20

export type CartItem = {
  key: string
  artworkNumber: number
  artworkId: string
  title: string
  locationName: string
  formatId: string
  formatLabel: string
  finishId: string
  finishLabel: LocalizedText
  unitPrice: number
  quantity: number
  thumbnail: string
}

export type NewCartItem = Omit<CartItem, 'quantity'>

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (item: NewCartItem, quantity?: number) => void
  removeItem: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function initialItems(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((item) => (item as { productType?: string }).productType !== 'paypal-live-test')
      : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(initialItems)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // The cart still works when storage is unavailable, it just won't persist.
    }
  }, [items])

  const addItem = useCallback((item: NewCartItem, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((candidate) => candidate.key === item.key)
      if (existing) {
        return current.map((candidate) => candidate.key === item.key
          ? { ...candidate, quantity: Math.min(MAX_QUANTITY, candidate.quantity + quantity) }
          : candidate)
      }
      return [...current, { ...item, quantity: Math.min(MAX_QUANTITY, quantity) }]
    })
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((candidate) => candidate.key !== key))
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) => {
      if (quantity < 1) return current.filter((candidate) => candidate.key !== key)
      return current.map((candidate) => candidate.key === key
        ? { ...candidate, quantity: Math.min(MAX_QUANTITY, quantity) }
        : candidate)
    })
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items])

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount,
    total,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
    isOpen,
    openCart,
    closeCart,
  }), [items, itemCount, total, addItem, removeItem, setQuantity, clearCart, isOpen, openCart, closeCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
