import type { Exercise, PlanDay, WorkoutSession } from '../types'
import { suggestNextSession } from '../lib/progression'
import { formatWeight } from '../lib/units'
import { useSettings } from '../context/SettingsContext'

interface Props {
  label: string
  planDay: PlanDay
  exercises: Exercise[]
  sessions: WorkoutSession[]
}

export function TodayPlanPreview({ label, planDay, exercises, sessions }: Props) {
  const { weightUnit } = useSettings()

  return (
    <div className="today-plan-preview">
      <p className="today-plan-preview-label meta-text">
        {label}: {planDay.label}
      </p>
      <ul className="today-plan-preview-list">
        {planDay.exercises.map((pe) => {
          const exercise = exercises.find((e) => e.id === pe.exerciseId)
          const suggestion = exercise ? suggestNextSession(exercise, sessions, weightUnit) : null
          return (
            <li key={pe.exerciseId}>
              <span>{exercise?.name ?? 'Unknown exercise'}</span>
              <span className="muted">
                {suggestion
                  ? `${formatWeight(suggestion.suggestedWeight, weightUnit)} x ${suggestion.suggestedReps}`
                  : `${pe.targetSets} sets`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
