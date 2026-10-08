import type { PlanDay, WorkoutPlan } from '../types'
import { todayIso } from '../lib/dates'

const RECOVERY_LABELS: Record<number, string> = {
  1: 'Wrecked',
  2: 'Sore',
  3: 'Okay',
  4: 'Good',
  5: 'Fresh',
}

interface Props {
  planDay: PlanDay | null
  /** The active plan, if any - lets today's session be swapped to a different one of its days
   * (e.g. doing Legs instead of today's scheduled Pull day). */
  plan?: WorkoutPlan | null
  onSelectDay: (dayId: string | undefined) => void
  hasActivePlan: boolean
  recovery: number
  onRecoveryChange: (value: number) => void
  onStart: () => void
  date: string
  onDateChange: (date: string) => void
  isToday: boolean
  /** Shown as a secondary option when this will be a freeform session and there's a prior one to repeat. */
  onRepeatLast?: () => void
}

function formatChosenDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function WorkoutHome({
  planDay,
  plan,
  onSelectDay,
  hasActivePlan,
  recovery,
  onRecoveryChange,
  onStart,
  date,
  onDateChange,
  isToday,
  onRepeatLast,
}: Props) {
  const showDayPicker = isToday && !!plan && plan.days.length > 0

  return (
    <div className="panel workout-home">
      <label className="workout-home-date-picker">
        <input
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </label>
      <p className="workout-home-date">{formatChosenDate(date)}</p>

      {showDayPicker ? (
        <label className="plan-name-field workout-day-picker">
          Workout
          <select
            value={planDay?.id ?? ''}
            onChange={(e) => onSelectDay(e.target.value || undefined)}
          >
            {!planDay && (
              <option value="" disabled>
                Select a workout
              </option>
            )}
            {plan!.days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <h2>{isToday && planDay ? planDay.label : 'Freeform Workout'}</h2>
      )}
      {!showDayPicker && !(isToday && planDay) && (
        <p className="muted">
          {isToday
            ? hasActivePlan
              ? "No workout scheduled today, but you can still log one."
              : 'No active plan yet.'
            : 'Backdated workouts are logged freeform.'}
        </p>
      )}

      <label className="recovery-field">
        How are you feeling? (1 Wrecked - 5 Fresh)
        <input
          type="range"
          min={1}
          max={5}
          value={recovery}
          onChange={(e) => onRecoveryChange(Number(e.target.value))}
        />
        <span>
          {recovery} - {RECOVERY_LABELS[recovery]}
        </span>
      </label>

      <button type="button" className="primary start-workout-btn" onClick={onStart}>
        Start Workout
      </button>
      {onRepeatLast && (
        <button type="button" className="link-btn repeat-last-btn" onClick={onRepeatLast}>
          Repeat Last Workout
        </button>
      )}
    </div>
  )
}
