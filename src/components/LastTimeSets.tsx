import type { WorkoutSession } from '../types'
import { historyForExercise } from '../lib/progression'
import { sessionUnit, convertWeight, formatWeight, type WeightUnit } from '../lib/units'

interface Props {
  sessions: WorkoutSession[]
  exerciseId: string
  targetUnit: WeightUnit
}

export function LastTimeSets({ sessions, exerciseId, targetUnit }: Props) {
  const history = historyForExercise(sessions, exerciseId)
  if (history.length === 0) return null
  const last = history[history.length - 1]
  const log = last.exercises.find((l) => l.exerciseId === exerciseId)
  if (!log || log.sets.length === 0) return null
  const unit = sessionUnit(last)

  return (
    <div className="last-time-sets">
      <p className="muted">Last time:</p>
      <div className="last-time-sets-row">
        {log.sets.map((s, i) => (
          <span key={i} className="last-time-chip">
            {formatWeight(Math.round(convertWeight(s.weight, unit, targetUnit) * 100) / 100, targetUnit)} x {s.reps}
          </span>
        ))}
      </div>
    </div>
  )
}
