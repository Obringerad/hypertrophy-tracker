import type { PlanDay } from '../types'

interface Props {
  planDay: PlanDay | null
  hasActivePlan: boolean
  recovery: number
  onRecoveryChange: (value: number) => void
  onStart: () => void
  date: string
  onDateChange: (date: string) => void
  isToday: boolean
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatChosenDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function WorkoutHome({
  planDay,
  hasActivePlan,
  recovery,
  onRecoveryChange,
  onStart,
  date,
  onDateChange,
  isToday,
}: Props) {
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
      <h2>{isToday && planDay ? planDay.label : 'Freeform workout'}</h2>
      {!(isToday && planDay) && (
        <p className="muted">
          {isToday
            ? hasActivePlan
              ? "No workout scheduled today, but you can still log one."
              : 'No active plan yet.'
            : 'Backdated workouts are logged freeform.'}
        </p>
      )}

      <label className="recovery-field">
        How are you feeling? (1 wrecked - 5 fresh)
        <input
          type="range"
          min={1}
          max={5}
          value={recovery}
          onChange={(e) => onRecoveryChange(Number(e.target.value))}
        />
        <span>{recovery}</span>
      </label>

      <button type="button" className="primary start-workout-btn" onClick={onStart}>
        Start Workout
      </button>
    </div>
  )
}
