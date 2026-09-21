import type { Exercise, WorkoutSession } from '../types'
import { historyForExercise } from './progression'

export interface ExerciseProgressPoint {
  date: string
  topWeight: number
  volume: number
}

/** Top set weight and total volume (reps × weight, summed across sets) for each session this exercise appeared in. */
export function exerciseProgressPoints(sessions: WorkoutSession[], exerciseId: string): ExerciseProgressPoint[] {
  return historyForExercise(sessions, exerciseId).map((session) => {
    const log = session.exercises.find((e) => e.exerciseId === exerciseId)!
    const topWeight = Math.max(...log.sets.map((s) => s.weight))
    const volume = log.sets.reduce((sum, s) => sum + s.reps * s.weight, 0)
    return { date: session.date, topWeight, volume }
  })
}

export function exercisesWithHistory(exercises: Exercise[], sessions: WorkoutSession[]): Exercise[] {
  const idsWithHistory = new Set(sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))
  return exercises.filter((e) => idsWithHistory.has(e.id))
}
