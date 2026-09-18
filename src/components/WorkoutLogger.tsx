import { useMemo, useState } from 'react'
import type { Exercise, LoggedExercise, PlanDay, SetEntry, WorkoutSession } from '../types'
import { suggestNextSession } from '../lib/progression'
import { SuggestionCard } from './SuggestionCard'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  onSave: (session: WorkoutSession) => void
  planDay?: PlanDay | null
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function WorkoutLogger({ exercises, sessions, onSave, planDay }: Props) {
  const [date, setDate] = useState(todayIso())
  const [recovery, setRecovery] = useState(3)
  const [logged, setLogged] = useState<LoggedExercise[]>([])
  const [activeExerciseId, setActiveExerciseId] = useState(planDay?.exercises[0]?.exerciseId ?? exercises[0]?.id ?? '')
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
        return prev.map((l) =>
          l.exerciseId === activeExerciseId ? { ...l, sets: [...l.sets, newSet] } : l,
        )
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

  function saveSession() {
    if (logged.length === 0) return
    onSave({ id: crypto.randomUUID(), date, recovery, exercises: logged })
    setLogged([])
  }

  if (exercises.length === 0) {
    return <p className="muted">Add an exercise first, then come back here to log a workout.</p>
  }

  return (
    <div className="panel">
      <h2>Log a workout</h2>

      <div className="session-meta">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Recovery (1 wrecked - 5 fresh)
          <input
            type="range"
            min={1}
            max={5}
            value={recovery}
            onChange={(e) => setRecovery(Number(e.target.value))}
          />
          <span>{recovery}</span>
        </label>
      </div>

      {planDay && planDay.exercises.length > 0 && (
        <div className="today-plan-card">
          <span className="muted">Today: {planDay.label}</span>
          <div className="exercise-chips">
            {planDay.exercises.map((pe) => {
              const ex = exercises.find((e) => e.id === pe.exerciseId)
              if (!ex) return null
              const done = logged.some((l) => l.exerciseId === pe.exerciseId && l.sets.length >= pe.targetSets)
              return (
                <button
                  key={pe.exerciseId}
                  type="button"
                  className={
                    pe.exerciseId === activeExerciseId
                      ? 'chip active'
                      : done
                        ? 'chip done'
                        : 'chip'
                  }
                  onClick={() => setActiveExerciseId(pe.exerciseId)}
                >
                  {ex.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

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
        <button type="button" className="primary" onClick={saveSession} disabled={logged.length === 0}>
          Save session
        </button>
      </div>
    </div>
  )
}
