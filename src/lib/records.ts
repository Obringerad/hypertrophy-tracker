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
