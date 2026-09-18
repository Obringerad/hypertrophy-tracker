import { useState } from 'react'
import type { Exercise, PlanDay, ScheduleType, WorkoutPlan } from '../types'
import { SPLIT_TEMPLATES, type SplitTemplate } from '../lib/splitTemplates'
import { materializePlan } from '../lib/planEngine'
import { PlanDayEditor } from './PlanDayEditor'

interface Props {
  existingExercises: Exercise[]
  onSave: (plan: WorkoutPlan, newExercises: Exercise[]) => void
  onCancel?: () => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Step = 'schedule' | 'split' | 'review'

export function PlanSetup({ existingExercises, onSave, onCancel }: Props) {
  const [step, setStep] = useState<Step>('schedule')
  const [name, setName] = useState('')
  const [durationWeeks, setDurationWeeks] = useState<number | ''>('')
  const [scheduleType, setScheduleType] = useState<ScheduleType>('fixed')
  const [fixedDays, setFixedDays] = useState<number[]>([1, 3, 5])
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [draftPlan, setDraftPlan] = useState<WorkoutPlan | null>(null)
  const [draftExercises, setDraftExercises] = useState<Exercise[]>([])

  function toggleDay(day: number) {
    setFixedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  function pickTemplate(template: SplitTemplate) {
    const { plan, newExercises } = materializePlan({
      name: name || template.name,
      template,
      scheduleType,
      fixedDays: scheduleType === 'fixed' ? fixedDays : undefined,
      daysPerWeek: scheduleType === 'flexible' ? daysPerWeek : undefined,
      durationWeeks: durationWeeks === '' ? undefined : durationWeeks,
      existingExercises,
    })
    setDraftPlan(plan)
    setDraftExercises(newExercises)
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

  function addExercise(dayId: string, name: string) {
    if (!draftPlan || !name.trim()) return
    const pool = [...existingExercises, ...draftExercises]
    let exercise = pool.find((e) => e.name.toLowerCase() === name.trim().toLowerCase())
    let nextDraftExercises = draftExercises
    if (!exercise) {
      exercise = {
        id: crypto.randomUUID(),
        name: name.trim(),
        muscleGroup: 'General',
        repRangeLow: 8,
        repRangeHigh: 12,
        weightIncrement: 2.5,
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

  function exerciseName(id: string): string {
    return [...existingExercises, ...draftExercises].find((e) => e.id === id)?.name ?? 'Unknown exercise'
  }

  return (
    <div className="panel">
      <h2>Set up a plan</h2>

      {step === 'schedule' && (
        <div className="wizard-step">
          <label className="plan-name-field">
            Plan name (optional)
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
              Fixed days
            </button>
            <button
              className={scheduleType === 'flexible' ? 'choice-btn active' : 'choice-btn'}
              onClick={() => setScheduleType('flexible')}
            >
              Goal days/week
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
              Days per week
              <input
                type="number"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
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
              disabled={scheduleType === 'fixed' ? fixedDays.length === 0 : daysPerWeek < 1}
              onClick={() => setStep('split')}
            >
              Next: choose a split
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

      {step === 'review' && draftPlan && (
        <div className="wizard-step">
          <p className="muted">Review the generated days, then save. You can tweak exercises any time later.</p>
          {draftPlan.days.map((day) => (
            <PlanDayEditor
              key={day.id}
              day={day}
              exerciseName={exerciseName}
              onRemoveExercise={(exerciseId) => removeExercise(day.id, exerciseId)}
              onAddExercise={(name) => addExercise(day.id, name)}
            />
          ))}
          <div className="wizard-actions">
            <button type="button" className="link-btn" onClick={() => setStep('split')}>
              Back
            </button>
            <button type="button" className="primary" onClick={() => onSave(draftPlan, draftExercises)}>
              Save plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
