export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  /** Target rep range this exercise is trained in, e.g. 8-12 for hypertrophy. */
  repRangeLow: number
  repRangeHigh: number
  /** Smallest jump available on the equipment (plates/pins), used when suggesting weight increases. */
  weightIncrement: number
}

export interface SetEntry {
  reps: number
  weight: number
  /** Rate of Perceived Exertion, 1-10. */
  rpe: number
}

export interface LoggedExercise {
  exerciseId: string
  sets: SetEntry[]
}

export interface WorkoutSession {
  id: string
  date: string // ISO date string (yyyy-mm-dd)
  /** Overall recovery/soreness rating for the session, 1 (wrecked) - 5 (fully recovered). */
  recovery: number
  exercises: LoggedExercise[]
  notes?: string
}

export type ProgressionAction = 'increase_weight' | 'increase_reps' | 'hold' | 'decrease' | 'deload'

export interface ProgressionSuggestion {
  exerciseId: string
  action: ProgressionAction
  suggestedWeight: number
  suggestedReps: number
  reason: string
}
