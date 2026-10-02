import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { WeightUnit } from '../lib/units'

export type TextSize = 'normal' | 'large'
export type Theme = 'system' | 'light' | 'dark'
export type LayoutMode = 'auto' | 'browser' | 'app'

/** True when the app was opened from the home screen, i.e. without any browser toolbars around it. */
function isStandalone(): boolean {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}

interface SettingsContextValue {
  weightUnit: WeightUnit
  setWeightUnit: (unit: WeightUnit) => void
  textSize: TextSize
  setTextSize: (size: TextSize) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  layoutMode: LayoutMode
  setLayoutMode: (mode: LayoutMode) => void
  /** What the layout actually resolves to - 'auto' picks app when installed, browser otherwise. */
  effectiveLayout: 'browser' | 'app'
  restTimerAutoStart: boolean
  setRestTimerAutoStart: (value: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

// Rescaling the root font-size scales every `rem` value in the app proportionally,
// so this is the only place text-size support needs to be wired in.
const ROOT_FONT_SIZE: Record<TextSize, string> = { normal: '', large: '18px' }

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [weightUnit, setWeightUnit] = useLocalStorage<WeightUnit>('hypertrophy.weightUnit', 'lb')
  const [textSize, setTextSize] = useLocalStorage<TextSize>('hypertrophy.textSize', 'normal')
  const [theme, setTheme] = useLocalStorage<Theme>('hypertrophy.theme', 'system')
  const [layoutMode, setLayoutMode] = useLocalStorage<LayoutMode>('hypertrophy.layoutMode', 'auto')
  const [restTimerAutoStart, setRestTimerAutoStart] = useLocalStorage('hypertrophy.restTimerAutoStart', false)

  useEffect(() => {
    document.documentElement.style.fontSize = ROOT_FONT_SIZE[textSize]
  }, [textSize])

  const effectiveLayout: 'browser' | 'app' = layoutMode === 'auto' ? (isStandalone() ? 'app' : 'browser') : layoutMode

  useEffect(() => {
    document.documentElement.setAttribute('data-layout', effectiveLayout)
  }, [effectiveLayout])

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  return (
    <SettingsContext.Provider
      value={{
        weightUnit,
        setWeightUnit,
        textSize,
        setTextSize,
        theme,
        setTheme,
        layoutMode,
        setLayoutMode,
        effectiveLayout,
        restTimerAutoStart,
        setRestTimerAutoStart,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
