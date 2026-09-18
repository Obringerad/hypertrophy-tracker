import { useMemo, useState } from 'react'
import type { Exercise, WorkoutSession } from '../types'
import { historyForExercise, suggestNextSession } from '../lib/progression'
import { SuggestionCard } from './SuggestionCard'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
}

export function HistoryView({ exercises, sessions }: Props) {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? '')
  const exercise = exercises.find((e) => e.id === exerciseId)

  const history = useMemo(
    () => (exercise ? historyForExercise(sessions, exercise.id).slice().reverse() : []),
    [exercise, sessions],
  )
  const suggestion = useMemo(() => (exercise ? suggestNextSession(exercise, sessions) : null), [exercise, sessions])

  if (exercises.length === 0) {
    return <p className="muted">Add an exercise to start tracking history.</p>
  }

  return (
    <div className="panel">
      <h2>History</h2>
      <div className="exercise-picker">
        <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {suggestion && <SuggestionCard suggestion={suggestion} />}

      {history.length === 0 ? (
        <p className="muted">No sessions logged for this exercise yet.</p>
      ) : (
        <table className="set-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sets</th>
              <th>Avg RPE</th>
              <th>Recovery</th>
            </tr>
          </thead>
          <tbody>
            {history.map((session) => {
              const log = session.exercises.find((e) => e.exerciseId === exerciseId)!
              const avgRpe = log.sets.reduce((a, s) => a + s.rpe, 0) / log.sets.length
              return (
                <tr key={session.id}>
                  <td>{session.date}</td>
                  <td>{log.sets.map((s) => `${s.weight}x${s.reps}`).join(', ')}</td>
                  <td>{avgRpe.toFixed(1)}</td>
                  <td>{session.recovery}/5</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
