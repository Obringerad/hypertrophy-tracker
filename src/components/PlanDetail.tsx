import type { Exercise, WorkoutPlan, WorkoutSession } from '../types'
import { planProgress } from '../lib/planProgress'
import { PlanCalendar } from './PlanCalendar'
import { PlanDayEditor } from './PlanDayEditor'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  plan: WorkoutPlan
  exercises: Exercise[]
  sessions: WorkoutSession[]
  isActive: boolean
  onSetActive: () => void
  onDelete: () => void
  onUpdatePlan: (plan: WorkoutPlan, newExercises?: Exercise[]) => void
  onBack: () => void
}

export function PlanDetail({ plan, exercises, sessions, isActive, onSetActive, onDelete, onUpdatePlan, onBack }: Props) {
  const progress = planProgress(plan, sessions)
  const exerciseName = (id: string) => exercises.find((e) => e.id === id)?.name ?? 'Unknown exercise'

  function removeExercise(dayId: string, exerciseId: string) {
    onUpdatePlan({
      ...plan,
      days: plan.days.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.exerciseId !== exerciseId) } : d,
      ),
    })
  }

  function addExercise(dayId: string, name: string) {
    if (!name.trim()) return
    const existing = exercises.find((e) => e.name.toLowerCase() === name.trim().toLowerCase())
    const newExercises: Exercise[] = []
    let exerciseId: string
    if (existing) {
      exerciseId = existing.id
    } else {
      const created: Exercise = {
        id: crypto.randomUUID(),
        name: name.trim(),
        muscleGroup: 'General',
        repRangeLow: 8,
        repRangeHigh: 12,
        weightIncrement: 2.5,
      }
      newExercises.push(created)
      exerciseId = created.id
    }
    onUpdatePlan(
      {
        ...plan,
        days: plan.days.map((d) =>
          d.id === dayId ? { ...d, exercises: [...d.exercises, { exerciseId, targetSets: 3 }] } : d,
        ),
      },
      newExercises,
    )
  }

  return (
    <div className="panel">
      <div className="plan-detail-header">
        <button type="button" className="link-btn" onClick={onBack}>
          &lt; All plans
        </button>
        {isActive ? (
          <span className="active-badge">Active</span>
        ) : (
          <button type="button" className="link-btn" onClick={onSetActive}>
            Make active
          </button>
        )}
      </div>

      <label className="plan-name-field">
        Plan name
        <input value={plan.name} onChange={(e) => onUpdatePlan({ ...plan, name: e.target.value })} />
      </label>

      <p className="muted">
        {plan.splitName} &middot;{' '}
        {plan.scheduleType === 'fixed'
          ? `Fixed days: ${(plan.fixedDays ?? []).map((d) => WEEKDAY_LABELS[d]).join(', ')}`
          : `Goal: ${plan.daysPerWeek} days/week (flexible)`}
      </p>

      <div className="progress-summary">
        <strong>
          {progress.totalWeeks ? `Week ${progress.week} of ${progress.totalWeeks}` : `Week ${progress.week}`}
        </strong>
        <span className="muted">
          {progress.expectedTotalSessions
            ? `${progress.completedSessions} / ${progress.expectedTotalSessions} sessions`
            : `${progress.completedSessions} sessions logged`}
        </span>
        {progress.expectedTotalSessions !== undefined && (
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, (progress.completedSessions / progress.expectedTotalSessions) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      <PlanCalendar plan={plan} sessions={sessions} exercises={exercises} />

      {plan.days.map((day) => (
        <PlanDayEditor
          key={day.id}
          day={day}
          exerciseName={exerciseName}
          onRemoveExercise={(exerciseId) => removeExercise(day.id, exerciseId)}
          onAddExercise={(name) => addExercise(day.id, name)}
        />
      ))}

      <div className="plan-detail-danger-zone">
        <button type="button" className="btn-delete" onClick={onDelete}>
          Delete plan
        </button>
      </div>
    </div>
  )
}
