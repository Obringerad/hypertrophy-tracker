import type { WorkoutSession } from '../types'

export type WeightUnit = 'lb' | 'kg'

const LB_PER_KG = 2.2046226218

export function formatWeight(weight: number, unit: WeightUnit): string {
  return `${weight} ${unit}`
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value
  const kg = from === 'lb' ? value / LB_PER_KG : value
  const converted = to === 'lb' ? kg * LB_PER_KG : kg
  return Math.round(converted * 100) / 100
}

/** The unit a session's weights were actually logged in. Sessions predating this feature default to lb. */
export function sessionUnit(session: WorkoutSession): WeightUnit {
  return session.unit ?? 'lb'
}
