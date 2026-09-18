import type { Exercise, PlanDay, WorkoutPlan } from '../types'
import type { SplitTemplate, TemplateDay } from './splitTemplates'

interface MaterializeOptions {
  name: string
  template: SplitTemplate
  scheduleType: 'fixed' | 'flexible'
  fixedDays?: number[]
  daysPerWeek?: number
  durationWeeks?: number
  existingExercises: Exercise[]
}

interface MaterializeResult {
  plan: WorkoutPlan
  newExercises: Exercise[]
}

function blankDaysFor(count: number): TemplateDay[] {
  return Array.from({ length: Math.max(count, 1) }, (_, i) => ({
    label: `Day ${i + 1}`,
    exercises: [],
  }))
}

/**
 * Turns a split template into a saveable plan, creating any exercises that
 * don't already exist in the user's library (matched by name, case-insensitive).
 */
export function materializePlan({
  name,
  template,
  scheduleType,
  fixedDays,
  daysPerWeek,
  durationWeeks,
  existingExercises,
}: MaterializeOptions): MaterializeResult {
  const templateDays =
    template.days.length > 0 ? template.days : blankDaysFor(fixedDays?.length ?? daysPerWeek ?? 1)

  const newExercises: Exercise[] = []
  const findOrCreate = (name: string, muscleGroup: string, repLow: number, repHigh: number, increment: number): Exercise => {
    const existing = [...existingExercises, ...newExercises].find(
      (e) => e.name.toLowerCase() === name.toLowerCase(),
    )
    if (existing) return existing
    const created: Exercise = {
      id: crypto.randomUUID(),
      name,
      muscleGroup,
      repRangeLow: repLow,
      repRangeHigh: repHigh,
      weightIncrement: increment,
    }
    newExercises.push(created)
    return created
  }

  const days: PlanDay[] = templateDays.map((day) => ({
    id: crypto.randomUUID(),
    label: day.label,
    exercises: day.exercises.map((te) => {
      const exercise = findOrCreate(te.name, te.muscleGroup, te.repRangeLow, te.repRangeHigh, te.weightIncrement)
      return { exerciseId: exercise.id, targetSets: te.targetSets }
    }),
  }))

  const plan: WorkoutPlan = {
    id: crypto.randomUUID(),
    name: name.trim() || template.name,
    splitName: template.name,
    scheduleType,
    fixedDays: scheduleType === 'fixed' ? [...(fixedDays ?? [])].sort((a, b) => a - b) : undefined,
    daysPerWeek: scheduleType === 'flexible' ? daysPerWeek : undefined,
    days,
    nextDayIndex: 0,
    startDate: new Date().toISOString().slice(0, 10),
    durationWeeks,
  }

  return { plan, newExercises }
}

/** The plan day scheduled for `today`, or null if a fixed schedule has no session today. */
export function resolveTodaysPlanDay(plan: WorkoutPlan, today: Date = new Date()): PlanDay | null {
  if (plan.days.length === 0) return null

  if (plan.scheduleType === 'fixed') {
    const fixedDays = plan.fixedDays ?? []
    const weekday = today.getDay()
    const position = fixedDays.indexOf(weekday)
    if (position === -1) return null
    return plan.days[position % plan.days.length]
  }

  return plan.days[plan.nextDayIndex % plan.days.length]
}

/** Advances a flexible schedule's rotation. Fixed schedules are unaffected. */
export function advancePlanRotation(plan: WorkoutPlan): WorkoutPlan {
  if (plan.scheduleType !== 'flexible' || plan.days.length === 0) return plan
  return { ...plan, nextDayIndex: (plan.nextDayIndex + 1) % plan.days.length }
}
