import type { WorkoutSession } from '../types'
import { convertWeight, sessionUnit, type WeightUnit } from './units'

/** Heaviest weight ever logged for this exercise across the given sessions, normalized to `targetUnit`. */
export function maxWeightEver(sessions: WorkoutSession[], exerciseId: string, targetUnit: WeightUnit): number {
  return sessions.reduce((max, s) => {
    const log = s.exercises.find((e) => e.exerciseId === exerciseId)
    if (!log || log.sets.length === 0) return max
    const unit = sessionUnit(s)
    const top = Math.max(...log.sets.map((set) => convertWeight(set.weight, unit, targetUnit)))
    return Math.max(max, top)
  }, 0)
}

export interface PersonalRecord {
  weight: number
  date: string
}

/** The heaviest set ever logged for this exercise, and the date it happened, normalized to `targetUnit`. */
export function bestEverWithDate(
  sessions: WorkoutSession[],
  exerciseId: string,
  targetUnit: WeightUnit,
): PersonalRecord | null {
  let best: PersonalRecord | null = null
  for (const s of sessions) {
    const log = s.exercises.find((e) => e.exerciseId === exerciseId)
    if (!log || log.sets.length === 0) continue
    const unit = sessionUnit(s)
    const top = Math.max(...log.sets.map((set) => convertWeight(set.weight, unit, targetUnit)))
    if (!best || top > best.weight) {
      best = { weight: top, date: s.date }
    }
  }
  return best
}
