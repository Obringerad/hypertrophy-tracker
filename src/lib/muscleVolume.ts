import type { Exercise, WorkoutSession } from '../types'

export interface MuscleGroupVolume {
  muscleGroup: string
  sets: number
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Total sets performed per muscle group during the current calendar week (Sun-Sat), busiest first. */
export function weeklyMuscleGroupVolume(
  sessions: WorkoutSession[],
  exercises: Exercise[],
  today: Date = new Date(),
): MuscleGroupVolume[] {
  const todayStripped = stripTime(today)
  const dayOfWeek = todayStripped.getDay()
  const weekStart = new Date(todayStripped)
  weekStart.setDate(weekStart.getDate() - dayOfWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const counts = new Map<string, number>()
  for (const s of sessions) {
    const d = parseIsoDate(s.date)
    if (d < weekStart || d > weekEnd) continue
    for (const log of s.exercises) {
      const muscleGroup = exercises.find((e) => e.id === log.exerciseId)?.muscleGroup ?? 'Unknown'
      counts.set(muscleGroup, (counts.get(muscleGroup) ?? 0) + log.sets.length)
    }
  }

  return [...counts.entries()]
    .map(([muscleGroup, sets]) => ({ muscleGroup, sets }))
    .sort((a, b) => b.sets - a.sets)
}
