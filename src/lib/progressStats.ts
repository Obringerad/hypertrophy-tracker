import type { Exercise, WorkoutSession } from '../types'
import { historyForExercise } from './progression'
import { convertWeight, sessionUnit, type WeightUnit } from './units'

export interface ExerciseProgressPoint {
  date: string
  topWeight: number
  volume: number
}

/**
 * Top set weight and total volume (reps × weight, summed across sets) for each session this
 * exercise appeared in, with weights normalized to `targetUnit` since past sessions may have
 * been logged in a different unit.
 */
export function exerciseProgressPoints(
  sessions: WorkoutSession[],
  exerciseId: string,
  targetUnit: WeightUnit,
): ExerciseProgressPoint[] {
  return historyForExercise(sessions, exerciseId).map((session) => {
    const log = session.exercises.find((e) => e.exerciseId === exerciseId)!
    const unit = sessionUnit(session)
    const weights = log.sets.map((s) => convertWeight(s.weight, unit, targetUnit))
    const topWeight = Math.max(...weights)
    const volume = log.sets.reduce((sum, s, i) => sum + s.reps * weights[i], 0)
    return { date: session.date, topWeight, volume }
  })
}

export function exercisesWithHistory(exercises: Exercise[], sessions: WorkoutSession[]): Exercise[] {
  const idsWithHistory = new Set(sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))
  return exercises.filter((e) => idsWithHistory.has(e.id))
}

export interface SessionVolumePoint {
  date: string
  volume: number
}

/** Total volume (reps × weight, summed across every set and exercise) for each session, oldest first, normalized to `targetUnit`. */
export function sessionVolumePoints(sessions: WorkoutSession[], targetUnit: WeightUnit): SessionVolumePoint[] {
  return sessions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((session) => {
      const unit = sessionUnit(session)
      return {
        date: session.date,
        volume: session.exercises.reduce(
          (sum, log) => sum + log.sets.reduce((setSum, s) => setSum + s.reps * convertWeight(s.weight, unit, targetUnit), 0),
          0,
        ),
      }
    })
}
