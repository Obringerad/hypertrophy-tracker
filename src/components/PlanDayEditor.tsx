import { useState } from 'react'
import type { PlanDay } from '../types'

interface Props {
  day: PlanDay
  exerciseName: (id: string) => string
  onRemoveExercise: (exerciseId: string) => void
  onAddExercise: (name: string) => void
}

export function PlanDayEditor({ day, exerciseName, onRemoveExercise, onAddExercise }: Props) {
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
            <span>
              {exerciseName(pe.exerciseId)} <span className="muted">&middot; {pe.targetSets} sets</span>
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
