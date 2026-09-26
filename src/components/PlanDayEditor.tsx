import { useState } from 'react'
import type { PlanDay } from '../types'

interface Props {
  day: PlanDay
  exerciseName: (id: string) => string
  onRemoveExercise: (exerciseId: string) => void
  onAddExercise: (name: string) => void
  onUpdateTargetSets: (exerciseId: string, targetSets: number) => void
}

export function PlanDayEditor({ day, exerciseName, onRemoveExercise, onAddExercise, onUpdateTargetSets }: Props) {
  const [newName, setNewName] = useState('')

  function submit() {
    onAddExercise(newName)
    setNewName('')
  }

  return (
    <div className="plan-day-editor">
      <h3>{day.label}</h3>
      <ul className="exercise-list">
        {day.exercises.map((pe) => (
          <li key={pe.exerciseId}>
            <span className="plan-day-exercise-info">
              {exerciseName(pe.exerciseId)}
              <span className="plan-day-target-sets">
                <input
                  type="number"
                  min={1}
                  value={pe.targetSets}
                  onChange={(e) => onUpdateTargetSets(pe.exerciseId, Math.max(1, Number(e.target.value)))}
                />
                <span className="muted">sets</span>
              </span>
            </span>
            <button className="link-btn" onClick={() => onRemoveExercise(pe.exerciseId)}>
              Remove
            </button>
          </li>
        ))}
        {day.exercises.length === 0 && <p className="muted">No exercises yet.</p>}
      </ul>
      <div className="add-exercise-inline">
        <input
          placeholder="Add exercise"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button type="button" onClick={submit}>
          Add
        </button>
      </div>
    </div>
  )
}
