/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type CloseHandler = () => void

type InterfaceControlsContextValue = {
  modalClose: CloseHandler | null
  registerModalClose: (handler: CloseHandler) => () => void
}

const InterfaceControlsContext = createContext<InterfaceControlsContextValue | null>(null)

export function InterfaceControlsProvider({ children }: { children: ReactNode }) {
  const [modalClose, setModalClose] = useState<CloseHandler | null>(null)

  const registerModalClose = useCallback((handler: CloseHandler) => {
    setModalClose(() => handler)
    return () => setModalClose((current) => current === handler ? null : current)
  }, [])

  const value = useMemo(() => ({ modalClose, registerModalClose }), [modalClose, registerModalClose])

  return <InterfaceControlsContext.Provider value={value}>{children}</InterfaceControlsContext.Provider>
}

export function useInterfaceControls() {
  const context = useContext(InterfaceControlsContext)
  if (!context) throw new Error('useInterfaceControls must be used inside InterfaceControlsProvider')
  return context
}
