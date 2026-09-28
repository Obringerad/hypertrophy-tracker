import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { WeightUnit } from '../lib/units'

export type TextSize = 'normal' | 'large'

interface SettingsContextValue {
  weightUnit: WeightUnit
  setWeightUnit: (unit: WeightUnit) => void
  textSize: TextSize
  setTextSize: (size: TextSize) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

// Rescaling the root font-size scales every `rem` value in the app proportionally,
// so this is the only place text-size support needs to be wired in.
const ROOT_FONT_SIZE: Record<TextSize, string> = { normal: '', large: '18px' }

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [weightUnit, setWeightUnit] = useLocalStorage<WeightUnit>('hypertrophy.weightUnit', 'lb')
  const [textSize, setTextSize] = useLocalStorage<TextSize>('hypertrophy.textSize', 'normal')

  useEffect(() => {
    document.documentElement.style.fontSize = ROOT_FONT_SIZE[textSize]
  }, [textSize])

  return (
    <SettingsContext.Provider value={{ weightUnit, setWeightUnit, textSize, setTextSize }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
