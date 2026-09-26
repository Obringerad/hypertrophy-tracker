import type { Exercise, LoggedExercise, ProgressionSuggestion, SetEntry, WorkoutSession } from '../types'
import { convertWeight, sessionUnit, type WeightUnit } from './units'

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function findLoggedExercise(session: WorkoutSession, exerciseId: string): LoggedExercise | undefined {
  return session.exercises.find((e) => e.exerciseId === exerciseId)
}

function setsInUnit(session: WorkoutSession, sets: SetEntry[], targetUnit: WeightUnit): SetEntry[] {
  const from = sessionUnit(session)
  if (from === targetUnit) return sets
  return sets.map((s) => ({ ...s, weight: convertWeight(s.weight, from, targetUnit) }))
}

/** Sessions that included this exercise, oldest first. */
export function historyForExercise(sessions: WorkoutSession[], exerciseId: string): WorkoutSession[] {
  return sessions
    .filter((s) => findLoggedExercise(s, exerciseId) !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Rule-based progressive-overload suggestion for the next time this exercise is trained.
 *
 * Reads the most recent session (top set performance + RPE) plus the one before it
 * (to catch two-session regressions worth deloading for) and the reported recovery rating.
 * Historical weights are normalized to `targetUnit` before comparing, since past sessions may
 * have been logged in a different unit than the one currently in use.
 */
export function suggestNextSession(
  exercise: Exercise,
  allSessions: WorkoutSession[],
  targetUnit: WeightUnit,
): ProgressionSuggestion | null {
  const history = historyForExercise(allSessions, exercise.id)
  if (history.length === 0) return null

  const last = history[history.length - 1]
  const lastLog = findLoggedExercise(last, exercise.id)!
  const sets = setsInUnit(last, lastLog.sets, targetUnit)
  if (sets.length === 0) return null

  const topWeight = Math.max(...sets.map((s) => s.weight))
  const topSets = sets.filter((s) => s.weight === topWeight)
  const minRepsAtTop = Math.min(...topSets.map((s) => s.reps))
  const avgRpe = avg(sets.map((s) => s.rpe))
  const hitFloor = minRepsAtTop >= exercise.repRangeLow
  const hitCeiling = minRepsAtTop >= exercise.repRangeHigh

  const prior = history.length > 1 ? history[history.length - 2] : undefined
  const priorLog = prior ? findLoggedExercise(prior, exercise.id) : undefined
  const priorSets = prior && priorLog ? setsInUnit(prior, priorLog.sets, targetUnit) : undefined
  const priorTopWeight = priorSets ? Math.max(...priorSets.map((s) => s.weight)) : undefined
  const priorAvgRpe = priorSets ? avg(priorSets.map((s) => s.rpe)) : undefined

  const regressed =
    priorTopWeight !== undefined &&
    priorAvgRpe !== undefined &&
    topWeight <= priorTopWeight &&
    !hitFloor &&
    avgRpe >= priorAvgRpe

  // Poor recovery reported, or two sessions in a row of stalling/regressing at a hard RPE: back off.
  if (last.recovery <= 2 || (regressed && avgRpe >= 9)) {
    const deloadWeight = round(topWeight * 0.85, exercise.weightIncrement)
    return {
      exerciseId: exercise.id,
      action: 'deload',
      suggestedWeight: deloadWeight,
      suggestedReps: exercise.repRangeLow,
      reason: last.recovery <= 2
        ? `Recovery was rated ${last.recovery}/5 last session. Dropping weight ~15% to let fatigue clear.`
        : `Reps have stalled below target for two sessions at a hard RPE. Dropping weight ~15% before pushing again.`,
    }
  }

  // Missed the rep floor or ground it out near failure: repeat the same weight/reps.
  if (!hitFloor || avgRpe >= 9.5) {
    return {
      exerciseId: exercise.id,
      action: 'hold',
      suggestedWeight: topWeight,
      suggestedReps: exercise.repRangeLow,
      reason: !hitFloor
        ? `Only hit ${minRepsAtTop} reps, below the ${exercise.repRangeLow}-rep target. Repeat this weight.`
        : `RPE averaged ${avgRpe.toFixed(1)}, close to failure. Repeat this weight before adding load.`,
    }
  }

  // Hit the top of the rep range with room to spare: add weight, reset reps to the bottom of the range.
  if (hitCeiling && avgRpe <= 8) {
    const nextWeight = round(topWeight + exercise.weightIncrement, exercise.weightIncrement)
    return {
      exerciseId: exercise.id,
      action: 'increase_weight',
      suggestedWeight: nextWeight,
      suggestedReps: exercise.repRangeLow,
      reason: `Hit ${minRepsAtTop} reps at RPE ${avgRpe.toFixed(1)}, the top of your ${exercise.repRangeLow}-${exercise.repRangeHigh} range with room left. Add weight.`,
    }
  }

  // In range but not maxed out: same weight, chase one more rep next time.
  return {
    exerciseId: exercise.id,
    action: 'increase_reps',
    suggestedWeight: topWeight,
    suggestedReps: Math.min(minRepsAtTop + 1, exercise.repRangeHigh),
    reason: `Hit ${minRepsAtTop} reps at RPE ${avgRpe.toFixed(1)}, still inside your rep range. Same weight, aim for ${Math.min(
      minRepsAtTop + 1,
      exercise.repRangeHigh,
    )} reps.`,
  }
}

function round(value: number, increment: number): number {
  if (increment <= 0) return Math.round(value * 100) / 100
  return Math.round(value / increment) * increment
}
