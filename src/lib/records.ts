import type { SetEntry, WorkoutSession } from '../types'
import { convertWeight, sessionUnit, type WeightUnit } from './units'

/** Whether this is the first set in the list at this exact weight+reps combo - used so a PR badge
 * shown once for a new weight isn't repeated on every identical set logged after it. */
export function isFirstAtWeightAndReps(sets: SetEntry[], index: number): boolean {
  const { weight, reps } = sets[index]
  return !sets.slice(0, index).some((s) => s.weight === weight && s.reps === reps)
}

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
