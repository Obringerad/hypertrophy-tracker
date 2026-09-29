import type { WorkoutSession } from '../types'

export type WeightUnit = 'lb' | 'kg'

const LB_PER_KG = 2.2046226218

export function formatWeight(weight: number, unit: WeightUnit): string {
  return `${weight} ${unit}`
}

/** Converts and rounds to a whole number - gym weights in either unit are practically always
 * tracked as whole numbers, and rounding to 2 decimal places left ugly values like 1.13kg
 * increments after a unit switch. */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value
  const kg = from === 'lb' ? value / LB_PER_KG : value
  const converted = to === 'lb' ? kg * LB_PER_KG : kg
  if (converted === 0) return 0
  return Math.max(1, Math.round(converted))
}

/** The unit a session's weights were actually logged in. Sessions predating this feature default to lb. */
export function sessionUnit(session: WorkoutSession): WeightUnit {
  return session.unit ?? 'lb'
}
