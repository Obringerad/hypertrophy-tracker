import type { WorkoutSession } from '../types'

/** Heaviest weight ever logged for this exercise across the given sessions. */
export function maxWeightEver(sessions: WorkoutSession[], exerciseId: string): number {
  return sessions.reduce((max, s) => {
    const log = s.exercises.find((e) => e.exerciseId === exerciseId)
    if (!log || log.sets.length === 0) return max
    return Math.max(max, ...log.sets.map((set) => set.weight))
  }, 0)
}
