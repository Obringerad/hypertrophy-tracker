import { useState } from 'react'
import type { Exercise, PlanDay, ScheduleType, WorkoutPlan } from '../types'
import { SPLIT_TEMPLATES, type SplitTemplate } from '../lib/splitTemplates'
import { materializePlan } from '../lib/planEngine'
import { useSettings } from '../context/SettingsContext'
import { PlanDayEditor, type NewExerciseDetails } from './PlanDayEditor'
import { MuscleGroupTag } from './MuscleGroupTag'

interface Props {
  existingExercises: Exercise[]
  /** Shows a brief walkthrough step first, for someone setting up their very first plan. */
  isFirstPlan?: boolean
  onSave: (plan: WorkoutPlan, newExercises: Exercise[], updatedExercises?: Exercise[]) => void
  onCancel?: () => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Step = 'intro' | 'schedule' | 'split' | 'weights' | 'review'

/** Epley-formula working weight for a given rep target, derived from an estimated one-rep max. */
function workingWeightFromOneRepMax(oneRepMax: number, reps: number, increment: number): number {
  const raw = oneRepMax / (1 + reps / 30)
  return Math.max(0, Math.round(raw / increment) * increment)
}

/** Rough estimate of another exercise's starting weight relative to the anchor lift for its muscle
 * group, based on how their target rep ranges compare (a higher rep ceiling usually means lighter
 * accessory work). Only ever compared within the same muscle group - a squat number says nothing
 * useful about an overhead press, so those are never cross-estimated against each other. */
function estimateStartingWeight(anchorWorkingWeight: number, anchor: Exercise, target: Exercise): number {
  const repCeilingDiff = target.repRangeHigh - anchor.repRangeHigh
  // Deliberately conservative - a higher rep target usually means a lighter, more isolated movement,
  // but this can't tell a barbell lift from a dumbbell or cable one, so it undershoots on purpose.
  // It's a starting point in an editable field, not a recommendation.
  const ratio = repCeilingDiff >= 3 ? 0.3 : repCeilingDiff > 0 ? 0.5 : 0.65
  const increment = target.weightIncrement || 2.5
  return Math.max(0, Math.round((anchorWorkingWeight * ratio) / increment) * increment)
}

/** For each muscle group appearing anywhere in the plan, the first exercise (in day/exercise order)
 * that uses it - the lift the user is asked for a one-rep max on, and the basis for estimating the
 * rest of that muscle group's exercises. */
function planMuscleGroupAnchors(
  plan: WorkoutPlan,
  exerciseById: Map<string, Exercise>,
): { muscleGroup: string; anchor: Exercise }[] {
  const seen = new Set<string>()
  const result: { muscleGroup: string; anchor: Exercise }[] = []
  for (const day of plan.days) {
    for (const pe of day.exercises) {
      const ex = exerciseById.get(pe.exerciseId)
      if (!ex || seen.has(ex.muscleGroup)) continue
      seen.add(ex.muscleGroup)
      result.push({ muscleGroup: ex.muscleGroup, anchor: ex })
    }
  }
  return result
}

export function PlanSetup({ existingExercises, isFirstPlan, onSave, onCancel }: Props) {
  const { weightUnit } = useSettings()
  const [step, setStep] = useState<Step>(isFirstPlan ? 'intro' : 'schedule')
  const [name, setName] = useState('')
  const [durationWeeks, setDurationWeeks] = useState<number | ''>('')
  const [scheduleType, setScheduleType] = useState<ScheduleType>('fixed')
  const [fixedDays, setFixedDays] = useState<number[]>([1, 3, 5])
  const [daysPerWeek, setDaysPerWeek] = useState<number | ''>(3)
  const [draftPlan, setDraftPlan] = useState<WorkoutPlan | null>(null)
  const [draftExercises, setDraftExercises] = useState<Exercise[]>([])
  const [existingExerciseUpdates, setExistingExerciseUpdates] = useState<Record<string, Exercise>>({})
  const [anchorWeights, setAnchorWeights] = useState<Record<string, string>>({})

  function toggleDay(day: number) {
    setFixedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  function pickTemplate(template: SplitTemplate) {
    const { plan, newExercises } = materializePlan({
      name: name || template.name,
      template,
      scheduleType,
      fixedDays: scheduleType === 'fixed' ? fixedDays : undefined,
      daysPerWeek: scheduleType === 'flexible' && daysPerWeek !== '' ? daysPerWeek : undefined,
      durationWeeks: durationWeeks === '' ? undefined : durationWeeks,
      existingExercises,
    })
    setDraftPlan(plan)
    setDraftExercises(newExercises)
    setStep('weights')
  }

  /** Converts each muscle group's entered one-rep-max guess into a working weight for its anchor
   * exercise, and estimates every other used exercise in that same muscle group from there - never
   * across muscle groups, since a squat number can't say anything useful about a shoulder press.
   * Muscle groups left blank are skipped entirely. */
  function applyStartingWeights() {
    if (!draftPlan) return
    const pool = [...existingExercises, ...draftExercises]
    const exerciseById = new Map(pool.map((e) => [e.id, e]))
    const usedIds = new Set(draftPlan.days.flatMap((d) => d.exercises.map((pe) => pe.exerciseId)))
    const anchors = planMuscleGroupAnchors(draftPlan, exerciseById)
    const updates = new Map<string, Exercise>()

    for (const { muscleGroup, anchor } of anchors) {
      const raw = anchorWeights[muscleGroup]
      const oneRepMax = raw ? Number(raw) : NaN
      if (!Number.isFinite(oneRepMax) || oneRepMax <= 0) continue

      const anchorWorkingWeight = workingWeightFromOneRepMax(
        oneRepMax,
        anchor.repRangeLow,
        anchor.weightIncrement || 2.5,
      )
      updates.set(anchor.id, { ...anchor, startingWeight: anchorWorkingWeight })

      for (const id of usedIds) {
        if (id === anchor.id || updates.has(id)) continue
        const target = exerciseById.get(id)
        if (!target || target.muscleGroup !== muscleGroup) continue
        updates.set(id, { ...target, startingWeight: estimateStartingWeight(anchorWorkingWeight, anchor, target) })
      }
    }

    if (updates.size > 0) {
      setDraftExercises((prev) => prev.map((e) => updates.get(e.id) ?? e))
      const existingUpdates: Record<string, Exercise> = {}
      for (const e of existingExercises) {
        const updated = updates.get(e.id)
        if (updated) existingUpdates[e.id] = updated
      }
      setExistingExerciseUpdates(existingUpdates)
    }
    setStep('review')
  }

  function removeExercise(dayId: string, exerciseId: string) {
    setDraftPlan((prev) =>
      prev
        ? {
            ...prev,
            days: prev.days.map((d) =>
              d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.exerciseId !== exerciseId) } : d,
            ),
          }
        : prev,
    )
  }

  function addExercise(dayId: string, name: string, details?: NewExerciseDetails) {
    if (!draftPlan || !name.trim()) return
    const pool = [...existingExercises, ...draftExercises]
    let exercise = pool.find((e) => e.name.toLowerCase() === name.trim().toLowerCase())
    let nextDraftExercises = draftExercises
    if (!exercise) {
      exercise = {
        id: crypto.randomUUID(),
        name: name.trim(),
        muscleGroup: details?.muscleGroup ?? 'General',
        repRangeLow: details?.repRangeLow ?? 8,
        repRangeHigh: details?.repRangeHigh ?? 12,
        weightIncrement: details?.weightIncrement ?? 2.5,
      }
      nextDraftExercises = [...draftExercises, exercise]
      setDraftExercises(nextDraftExercises)
    }
    const exerciseId = exercise.id
    setDraftPlan((prev) =>
      prev
        ? {
            ...prev,
            days: prev.days.map((d: PlanDay) =>
              d.id === dayId ? { ...d, exercises: [...d.exercises, { exerciseId, targetSets: 3 }] } : d,
            ),
          }
        : prev,
    )
  }

  function updateTargetSets(dayId: string, exerciseId: string, targetSets: number) {
    setDraftPlan((prev) =>
      prev
        ? {
            ...prev,
            days: prev.days.map((d) =>
              d.id === dayId
                ? {
                    ...d,
                    exercises: d.exercises.map((pe) =>
                      pe.exerciseId === exerciseId ? { ...pe, targetSets } : pe,
                    ),
                  }
                : d,
            ),
          }
        : prev,
    )
  }

  function reorderExercises(dayId: string, fromIndex: number, toIndex: number) {
    setDraftPlan((prev) =>
      prev
        ? {
            ...prev,
            days: prev.days.map((d) => {
              if (d.id !== dayId) return d
              const next = [...d.exercises]
              const [moved] = next.splice(fromIndex, 1)
              next.splice(toIndex, 0, moved)
              return { ...d, exercises: next }
            }),
          }
        : prev,
    )
  }

  function updateStartingWeight(exerciseId: string, weight: number) {
    const clamped = Math.max(0, weight)
    if (draftExercises.some((e) => e.id === exerciseId)) {
      setDraftExercises((prev) => prev.map((e) => (e.id === exerciseId ? { ...e, startingWeight: clamped } : e)))
      return
    }
    const base = existingExercises.find((e) => e.id === exerciseId)
    if (!base) return
    setExistingExerciseUpdates((prev) => ({
      ...prev,
      [exerciseId]: { ...base, ...prev[exerciseId], startingWeight: clamped },
    }))
  }

  return (
    <div className="panel">
      <h2>Set Up a Plan</h2>

      {step === 'intro' && (
        <div className="wizard-step">
          <p>Setting up a plan takes four short steps:</p>
          <ol className="guide-list">
            <li>
              <strong>Schedule</strong> - which days of the week you'll train.
            </li>
            <li>
              <strong>Split</strong> - a rotation of training days (or build your own from scratch).
            </li>
            <li>
              <strong>Starting weights</strong> - your best guess at your one-rep max for a few key
              exercises, so your first workout isn't blank.
            </li>
            <li>
              <strong>Log workouts</strong> - after that, weight and rep suggestions come from how each
              session actually goes.
            </li>
          </ol>
          <div className="wizard-actions">
            <button type="button" className="primary" onClick={() => setStep('schedule')}>
              Let's Go
            </button>
          </div>
        </div>
      )}

      {step === 'schedule' && (
        <div className="wizard-step">
          <label className="plan-name-field">
            Plan Name (Optional)
            <input
              placeholder="e.g. 10 Week PPL"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="plan-name-field">
            Duration in weeks (optional, leave blank for open-ended)
            <input
              type="number"
              min={1}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>

          <div className="schedule-type-picker">
            <button
              className={scheduleType === 'fixed' ? 'choice-btn active' : 'choice-btn'}
              onClick={() => setScheduleType('fixed')}
            >
              Fixed Days
            </button>
            <button
              className={scheduleType === 'flexible' ? 'choice-btn active' : 'choice-btn'}
              onClick={() => setScheduleType('flexible')}
            >
              Goal Days/Week
            </button>
          </div>

          {scheduleType === 'fixed' ? (
            <div className="weekday-picker">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  className={fixedDays.includes(i) ? 'choice-btn active' : 'choice-btn'}
                  onClick={() => toggleDay(i)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <label className="days-per-week-picker">
              Days per Week
              <input
                type="number"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </label>
          )}

          <div className="wizard-actions">
            {onCancel && (
              <button type="button" className="link-btn" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button
              type="button"
              className="primary"
              disabled={scheduleType === 'fixed' ? fixedDays.length === 0 : daysPerWeek === '' || daysPerWeek < 1}
              onClick={() => setStep('split')}
            >
              Next: Choose a Split
            </button>
          </div>
        </div>
      )}

      {step === 'split' && (
        <div className="wizard-step">
          <p className="muted">
            Pick the structure for your mesocycle. This defines the rotation of training days — it will cycle
            through your schedule regardless of how many days you picked.
          </p>
          <div className="split-list">
            {SPLIT_TEMPLATES.map((template) => (
              <button key={template.id} className="split-card" onClick={() => pickTemplate(template)}>
                <strong>{template.name}</strong>
                <span className="muted">{template.description}</span>
                {template.days.length > 0 && (
                  <span className="split-days-preview">{template.days.map((d) => d.label).join(' -> ')}</span>
                )}
              </button>
            ))}
          </div>
          <div className="wizard-actions">
            <button type="button" className="link-btn" onClick={() => setStep('schedule')}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'weights' && draftPlan && (
        <div className="wizard-step">
          <p className="muted">
            What would you guess is your one-rep max for each muscle group's main exercise, in {weightUnit}?
            Optional - we'll work out a starting weight for it and estimate the rest of that muscle group's
            exercises from there. Leave any of these blank to skip.
          </p>
          {planMuscleGroupAnchors(draftPlan, new Map([...existingExercises, ...draftExercises].map((e) => [e.id, e]))).map(
            ({ muscleGroup, anchor }) => (
              <label key={muscleGroup} className="plan-name-field">
                <MuscleGroupTag muscleGroup={muscleGroup} /> {anchor.name} (1RM)
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={anchorWeights[muscleGroup] ?? ''}
                  onChange={(e) => setAnchorWeights((prev) => ({ ...prev, [muscleGroup]: e.target.value }))}
                />
              </label>
            ),
          )}
          <div className="wizard-actions">
            <button type="button" className="link-btn" onClick={() => setStep('split')}>
              Back
            </button>
            <button type="button" className="primary" onClick={applyStartingWeights}>
              Next: Review
            </button>
          </div>
        </div>
      )}

      {step === 'review' && draftPlan && (
        <div className="wizard-step">
          <p className="muted">Review the generated days, then save. You can tweak exercises any time later.</p>
          {draftPlan.days.map((day) => (
            <PlanDayEditor
              key={day.id}
              day={day}
              exercises={[
                ...existingExercises.map((e) => existingExerciseUpdates[e.id] ?? e),
                ...draftExercises,
              ]}
              onRemoveExercise={(exerciseId) => removeExercise(day.id, exerciseId)}
              onAddExercise={(name, details) => addExercise(day.id, name, details)}
              onUpdateTargetSets={(exerciseId, targetSets) => updateTargetSets(day.id, exerciseId, targetSets)}
              onReorderExercises={(fromIndex, toIndex) => reorderExercises(day.id, fromIndex, toIndex)}
              weightUnit={weightUnit}
              onUpdateStartingWeight={updateStartingWeight}
            />
          ))}
          <div className="wizard-actions">
            <button type="button" className="link-btn" onClick={() => setStep('weights')}>
              Back
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => onSave(draftPlan, draftExercises, Object.values(existingExerciseUpdates))}
            >
              Save Plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
