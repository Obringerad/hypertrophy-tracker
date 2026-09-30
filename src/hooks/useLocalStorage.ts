import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or unavailable (e.g. private browsing) - nothing we can do about it here.
    }
  }, [key, value])

  // Stay in sync with this same key changing in another tab - the browser only fires this in OTHER
  // tabs, never the one that made the change, so this can't create a feedback loop. Without it, two
  // tabs open at once silently diverge, and whichever saves last wins, clobbering the other's data.
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== key) return
      try {
        setValue(e.newValue !== null ? (JSON.parse(e.newValue) as T) : initialValue)
      } catch {
        // Malformed value written elsewhere - ignore and keep what we have.
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue] as const
}
