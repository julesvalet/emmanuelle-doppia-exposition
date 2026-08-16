/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SALES_OPEN_AT_ISO, SALES_OPEN_AT_MS } from './data/sales'

type StoreStatusResponse = {
  serverTime: string
  salesOpenAt: string
  salesOpen: boolean
}

type SalesContextValue = {
  isSalesOpen: boolean
  remainingMs: number
  statusReady: boolean
  refreshStatus: () => Promise<void>
}

const SalesContext = createContext<SalesContextValue | null>(null)

export function SalesProvider({ children }: { children: ReactNode }) {
  const [clock, setClock] = useState(() => Date.now())
  const [serverOffset, setServerOffset] = useState(0)
  const [statusReady, setStatusReady] = useState(false)

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/store-status', { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`Store status: ${response.status}`)
      const data = await response.json() as StoreStatusResponse
      if (data.salesOpenAt !== SALES_OPEN_AT_ISO) throw new Error('Unexpected sales opening date')
      setServerOffset(Date.parse(data.serverTime) - Date.now())
    } catch (error) {
      // The UTC deadline still works independently of the browser timezone. Server endpoints
      // remain the authority for checkout if this non-critical status request is unavailable.
      console.warn('Unable to refresh store status', error)
    } finally {
      setStatusReady(true)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
    const statusTimer = window.setInterval(() => void refreshStatus(), 20_000)
    return () => window.clearInterval(statusTimer)
  }, [refreshStatus])

  useEffect(() => {
    const clockTimer = window.setInterval(() => setClock(Date.now()), 1_000)
    return () => window.clearInterval(clockTimer)
  }, [])

  const remainingMs = Math.max(0, SALES_OPEN_AT_MS - (clock + serverOffset))
  const isSalesOpen = remainingMs === 0

  const value = useMemo<SalesContextValue>(() => ({
    isSalesOpen,
    remainingMs,
    statusReady,
    refreshStatus,
  }), [isSalesOpen, remainingMs, statusReady, refreshStatus])

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>
}

export function useSales() {
  const context = useContext(SalesContext)
  if (!context) throw new Error('useSales must be used inside SalesProvider')
  return context
}
