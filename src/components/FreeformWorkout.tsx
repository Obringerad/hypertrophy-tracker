import { useEffect, useMemo, useState } from 'react'
import type { Exercise, LoggedExercise, SetEntry, WorkoutSession } from '../types'
import { suggestNextSession } from '../lib/progression'
import { maxWeightEver } from '../lib/records'
import { formatWeight } from '../lib/units'
import { useSettings } from '../context/SettingsContext'
import { SuggestionCard } from './SuggestionCard'
import { RestTimer } from './RestTimer'

export interface FreeformWorkoutProgress {
  logged: LoggedExercise[]
  notes: string
  activeExerciseId: string
}

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  recovery: number
  date: string
  activePlanId?: string
  onFinish: (session: WorkoutSession) => void
  onCancel: () => void
  initialProgress?: FreeformWorkoutProgress
  onProgressChange: (progress: FreeformWorkoutProgress) => void
}

export function FreeformWorkout({
  exercises,
  sessions,
  recovery,
  date,
  activePlanId,
  onFinish,
  onCancel,
  initialProgress,
  onProgressChange,
}: Props) {
  const { weightUnit } = useSettings()
  const [logged, setLogged] = useState<LoggedExercise[]>(() => initialProgress?.logged ?? [])
  const [activeExerciseId, setActiveExerciseId] = useState(
    () => initialProgress?.activeExerciseId ?? exercises[0]?.id ?? '',
  )
  const [setForm, setSetForm] = useState({ weight: 0, reps: 0, rpe: 8 })
  const [exerciseFilter, setExerciseFilter] = useState('')
  const [notes, setNotes] = useState(() => initialProgress?.notes ?? '')

  // Persist progress on every change so a backgrounded/reloaded tab can resume mid-workout.
  useEffect(() => {
    onProgressChange({ logged, notes, activeExerciseId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logged, notes, activeExerciseId])

  const activeExercise = exercises.find((e) => e.id === activeExerciseId)
  const suggestion = useMemo(
    () => (activeExercise ? suggestNextSession(activeExercise, sessions, weightUnit) : null),
    [activeExercise, sessions, weightUnit],
  )
  const activeLog = logged.find((l) => l.exerciseId === activeExerciseId)
  const priorBest = maxWeightEver(sessions, activeExerciseId, weightUnit)

  const filteredExercises = exercises.filter((e) => e.name.toLowerCase().includes(exerciseFilter.toLowerCase()))

  function selectExercise(id: string) {
    setActiveExerciseId(id)
  }

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
    onFinish({
      id: crypto.randomUUID(),
      date,
      recovery,
      exercises: logged,
      notes: notes.trim() || undefined,
      planId: activePlanId,
      unit: weightUnit,
    })
  }

  return (
    <div className="panel">
      <h2>Freeform workout</h2>

      <div className="exercise-picker freeform-exercise-picker">
        <input
          type="text"
          placeholder="Filter exercises..."
          value={exerciseFilter}
          onChange={(e) => setExerciseFilter(e.target.value)}
        />
        <select
          value={filteredExercises.some((e) => e.id === activeExerciseId) ? activeExerciseId : ''}
          onChange={(e) => selectExercise(e.target.value)}
        >
          {!filteredExercises.some((e) => e.id === activeExerciseId) && (
            <option value="" disabled>
              Select an exercise
            </option>
          )}
          {filteredExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {suggestion && <SuggestionCard suggestion={suggestion} />}

      <RestTimer />

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
              <tr key={i} className="set-table-logged-row">
                <td>
                  <span className="set-logged-check">&#10003;</span> {i + 1}
                </td>
                <td>
                  {formatWeight(s.weight, weightUnit)}
                  {s.weight > priorBest && <span className="pr-badge">PR</span>}
                </td>
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

      <label className="session-notes-field">
        Notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Anything to remember for next time?"
          rows={3}
        />
      </label>

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
