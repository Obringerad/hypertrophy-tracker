import { useMemo, useState } from 'react'
import type { Exercise, LoggedExercise, SetEntry, WorkoutSession } from '../types'
import { suggestNextSession } from '../lib/progression'
import { SuggestionCard } from './SuggestionCard'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  recovery: number
  date: string
  activePlanId?: string
  onFinish: (session: WorkoutSession) => void
  onCancel: () => void
}

export function FreeformWorkout({ exercises, sessions, recovery, date, activePlanId, onFinish, onCancel }: Props) {
  const [logged, setLogged] = useState<LoggedExercise[]>([])
  const [activeExerciseId, setActiveExerciseId] = useState(exercises[0]?.id ?? '')
  const [setForm, setSetForm] = useState({ weight: 0, reps: 0, rpe: 8 })

  const activeExercise = exercises.find((e) => e.id === activeExerciseId)
  const suggestion = useMemo(
    () => (activeExercise ? suggestNextSession(activeExercise, sessions) : null),
    [activeExercise, sessions],
  )
  const activeLog = logged.find((l) => l.exerciseId === activeExerciseId)

  function addSet() {
    if (!activeExerciseId || setForm.reps <= 0) return
    setLogged((prev) => {
      const existing = prev.find((l) => l.exerciseId === activeExerciseId)
      const newSet: SetEntry = { ...setForm }
      if (existing) {
        return prev.map((l) => (l.exerciseId === activeExerciseId ? { ...l, sets: [...l.sets, newSet] } : l))
      }
      return [...prev, { exerciseId: activeExerciseId, sets: [newSet] }]
    })
  }

  function removeSet(exerciseId: string, index: number) {
    setLogged((prev) =>
      prev
        .map((l) => (l.exerciseId === exerciseId ? { ...l, sets: l.sets.filter((_, i) => i !== index) } : l))
        .filter((l) => l.sets.length > 0),
    )
  }

  function finish() {
    if (logged.length === 0) return
    onFinish({ id: crypto.randomUUID(), date, recovery, exercises: logged, planId: activePlanId })
  }

  return (
    <div className="panel">
      <h2>Freeform workout</h2>

      <div className="exercise-picker">
        <select value={activeExerciseId} onChange={(e) => setActiveExerciseId(e.target.value)}>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {suggestion && <SuggestionCard suggestion={suggestion} />}

      <div className="set-form">
        <label>
          Weight
          <input
            type="number"
            step={0.5}
            value={setForm.weight}
            onChange={(e) => setSetForm({ ...setForm, weight: Number(e.target.value) })}
          />
        </label>
        <label>
          Reps
          <input
            type="number"
            min={0}
            value={setForm.reps}
            onChange={(e) => setSetForm({ ...setForm, reps: Number(e.target.value) })}
          />
        </label>
        <label>
          RPE
          <input
            type="number"
            min={1}
            max={10}
            value={setForm.rpe}
            onChange={(e) => setSetForm({ ...setForm, rpe: Number(e.target.value) })}
          />
        </label>
        <button type="button" onClick={addSet}>
          Add set
        </button>
      </div>

      {activeLog && activeLog.sets.length > 0 && (
        <table className="set-table">
          <thead>
            <tr>
              <th>Set</th>
              <th>Weight</th>
              <th>Reps</th>
              <th>RPE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activeLog.sets.map((s, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{s.weight}</td>
                <td>{s.reps}</td>
                <td>{s.rpe}</td>
                <td>
                  <button className="link-btn" onClick={() => removeSet(activeExerciseId, i)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="session-summary">
        <p className="muted">
          {logged.length} exercise{logged.length === 1 ? '' : 's'} logged this session.
        </p>
        <div className="wizard-actions">
          <button type="button" className="link-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={finish} disabled={logged.length === 0}>
            Finish workout
          </button>
        </div>
      </div>
    </div>
  )
}
