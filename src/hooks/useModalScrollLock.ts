import { useEffect } from 'react'

export const modalScrollLockEvent = 'emdp:modal-scroll-lock'

export type ModalScrollLockDetail = {
  locked: boolean
  scrollY: number
}

let lockCount = 0
let lockedScrollY = 0
let previousBodyOverflow = ''

const notifyScrollLock = (locked: boolean) => {
  window.dispatchEvent(new CustomEvent<ModalScrollLockDetail>(modalScrollLockEvent, {
    detail: { locked, scrollY: lockedScrollY },
  }))
}

export function useModalScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    if (lockCount === 0) {
      lockedScrollY = window.scrollY
      previousBodyOverflow = document.body.style.overflow
      notifyScrollLock(true)
      document.documentElement.classList.add('emdp-modal-open')
      document.body.style.overflow = 'hidden'
    }
    lockCount += 1

    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount !== 0) return

      document.body.style.overflow = previousBodyOverflow
      document.documentElement.classList.remove('emdp-modal-open')
      window.scrollTo(0, lockedScrollY)
      notifyScrollLock(false)
    }
  }, [locked])
}
