import type { WorkoutSession } from '../types'

/** True when the most recent `count` sessions all reported poor recovery (<=2/5). */
export function recentRecoveryIsLow(sessions: WorkoutSession[], count = 2): boolean {
  const sorted = sessions.slice().sort((a, b) => b.date.localeCompare(a.date))
  const recent = sorted.slice(0, count)
  return recent.length === count && recent.every((s) => s.recovery <= 2)
}
