import type { Exercise, WorkoutPlan } from '../types'
import { resolveTodaysPlanDay } from '../lib/planEngine'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  plan: WorkoutPlan
  exercises: Exercise[]
  onRedoSetup: () => void
}

export function PlanOverview({ plan, exercises, onRedoSetup }: Props) {
  const todaysDay = resolveTodaysPlanDay(plan)
  const exerciseName = (id: string) => exercises.find((e) => e.id === id)?.name ?? 'Unknown exercise'

  return (
    <div className="panel">
      <h2>Your plan: {plan.splitName}</h2>
      <p className="muted">
        {plan.scheduleType === 'fixed'
          ? `Fixed days: ${(plan.fixedDays ?? []).map((d) => WEEKDAY_LABELS[d]).join(', ')}`
          : `Goal: ${plan.daysPerWeek} days/week (flexible)`}
      </p>
      <p className="muted">
        {todaysDay ? (
          <>
            Today: <strong>{todaysDay.label}</strong>
          </>
        ) : (
          'No workout scheduled for today.'
        )}
      </p>

      {plan.days.map((day) => (
        <div key={day.id} className="plan-day-editor">
          <h3>{day.label}</h3>
          <ul className="exercise-list">
            {day.exercises.map((pe) => (
              <li key={pe.exerciseId}>
                <span>
                  {exerciseName(pe.exerciseId)} <span className="muted">&middot; {pe.targetSets} sets</span>
                </span>
              </li>
            ))}
            {day.exercises.length === 0 && <p className="muted">No exercises in this day.</p>}
          </ul>
        </div>
      ))}

      <button type="button" className="primary" onClick={onRedoSetup}>
        Redo plan setup
      </button>
    </div>
  )
}
