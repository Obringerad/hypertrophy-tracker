import type { PlanDay } from '../types'

interface Props {
  planDay: PlanDay | null
  hasActivePlan: boolean
  recovery: number
  onRecoveryChange: (value: number) => void
  onStart: () => void
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function WorkoutHome({ planDay, hasActivePlan, recovery, onRecoveryChange, onStart }: Props) {
  return (
    <div className="panel workout-home">
      <p className="workout-home-date">{formatToday()}</p>
      <h2>{planDay ? planDay.label : 'Freeform workout'}</h2>
      {!planDay && (
        <p className="muted">
          {hasActivePlan ? "No workout scheduled today, but you can still log one." : 'No active plan yet.'}
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
