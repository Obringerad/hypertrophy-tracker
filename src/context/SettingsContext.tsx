import { createContext, useContext, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { WeightUnit } from '../lib/units'

interface SettingsContextValue {
  weightUnit: WeightUnit
  setWeightUnit: (unit: WeightUnit) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [weightUnit, setWeightUnit] = useLocalStorage<WeightUnit>('hypertrophy.weightUnit', 'lb')
  return <SettingsContext.Provider value={{ weightUnit, setWeightUnit }}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
