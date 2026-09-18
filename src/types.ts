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

export interface PlanExercise {
  exerciseId: string
  targetSets: number
}

export interface PlanDay {
  id: string
  label: string
  exercises: PlanExercise[]
}

export type ScheduleType = 'fixed' | 'flexible'

/**
 * A day of the week, 0 (Sunday) - 6 (Saturday), matching Date#getDay().
 */
export type Weekday = number

export interface WorkoutPlan {
  id: string
  splitName: string
  scheduleType: ScheduleType
  /** Sorted ascending. Only set when scheduleType is 'fixed'. */
  fixedDays?: Weekday[]
  /** Only set when scheduleType is 'flexible'. */
  daysPerWeek?: number
  /** Ordered rotation of day templates, e.g. [Push, Pull, Legs]. */
  days: PlanDay[]
  /** Index into `days` for the next flexible-schedule session. Unused for fixed schedules. */
  nextDayIndex: number
}

export type ProgressionAction = 'increase_weight' | 'increase_reps' | 'hold' | 'decrease' | 'deload'

export interface ProgressionSuggestion {
  exerciseId: string
  action: ProgressionAction
  suggestedWeight: number
  suggestedReps: number
  reason: string
}
