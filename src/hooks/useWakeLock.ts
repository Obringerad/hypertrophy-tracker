import { useEffect } from 'react'

/**
 * Asks the browser to keep the screen on while `active` is true (e.g. during a workout, so the phone
 * doesn't dim and lock between sets). Browsers drop the lock whenever the tab is hidden, so it's
 * re-requested when the tab becomes visible again. Silently does nothing where the Wake Lock API is
 * unsupported or refused (low battery, etc).
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    async function request() {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        sentinel = lock
      } catch {
        // Refused or unsupported right now - not worth surfacing.
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinel?.release()
    }
  }, [active])
}
