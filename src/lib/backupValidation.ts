function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isValidExercise(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.muscleGroup) &&
    isFiniteNumber(value.repRangeLow) &&
    isFiniteNumber(value.repRangeHigh) &&
    isFiniteNumber(value.weightIncrement) &&
    (value.startingWeight === undefined || isFiniteNumber(value.startingWeight))
  )
}

function isValidSetEntry(value: unknown): boolean {
  return isRecord(value) && isFiniteNumber(value.reps) && isFiniteNumber(value.weight) && isFiniteNumber(value.rpe)
}

function isValidSession(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.date) || !isFiniteNumber(value.recovery)) return false
  if (!Array.isArray(value.exercises)) return false
  return value.exercises.every((log) => {
    if (!isRecord(log) || !isNonEmptyString(log.exerciseId) || !Array.isArray(log.sets)) return false
    return log.sets.every(isValidSetEntry)
  })
}

function isValidPlanDay(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.label) || !Array.isArray(value.exercises)) return false
  return value.exercises.every(
    (pe) => isRecord(pe) && isNonEmptyString(pe.exerciseId) && isFiniteNumber(pe.targetSets),
  )
}

function isValidPlan(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isNonEmptyString(value.splitName) ||
    (value.scheduleType !== 'fixed' && value.scheduleType !== 'flexible') ||
    !Array.isArray(value.days) ||
    !isFiniteNumber(value.nextDayIndex) ||
    !isNonEmptyString(value.startDate)
  ) {
    return false
  }
  return value.days.every(isValidPlanDay)
}

/**
 * Checks that an imported backup file has the shape the app expects, so a corrupted or hand-edited
 * file is rejected with a clear message up front instead of silently loading broken data (NaN
 * weights, "Unknown exercise" everywhere, a plan that can't render its days, etc).
 *
 * Returns an error message describing the problem, or null if the data looks valid enough to import.
 */
export function validateBackupData(data: unknown): string | null {
  if (!isRecord(data)) return 'This file is not a valid backup - it is not a JSON object.'

  if (data.exercises !== undefined && (!Array.isArray(data.exercises) || !data.exercises.every(isValidExercise))) {
    return 'This file is not a valid backup - its exercise list is malformed.'
  }
  if (data.sessions !== undefined && (!Array.isArray(data.sessions) || !data.sessions.every(isValidSession))) {
    return 'This file is not a valid backup - its workout history is malformed.'
  }
  if (data.plans !== undefined && (!Array.isArray(data.plans) || !data.plans.every(isValidPlan))) {
    return 'This file is not a valid backup - its plans are malformed.'
  }
  if (
    data.activePlanId !== undefined &&
    data.activePlanId !== null &&
    !isNonEmptyString(data.activePlanId)
  ) {
    return 'This file is not a valid backup - its active plan reference is malformed.'
  }

  return null
}
