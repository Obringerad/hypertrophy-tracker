import { useEffect, useMemo, useState } from 'react'
import type { Exercise, LoggedExercise, PlanDay, SetEntry, WorkoutSession } from '../types'
import { suggestNextSession } from '../lib/progression'
import { maxWeightEver } from '../lib/records'
import { formatWeight } from '../lib/units'
import { useSettings } from '../context/SettingsContext'
import { SuggestionCard } from './SuggestionCard'
import { RestTimer } from './RestTimer'

interface Props {
  planDay: PlanDay
  exercises: Exercise[]
  sessions: WorkoutSession[]
  recovery: number
  date: string
  activePlanId?: string
  onFinish: (session: WorkoutSession) => void
  onCancel: () => void
}

interface QueueItem {
  exerciseId: string
  setNumber: number
  targetSets: number
}

function buildQueue(planDay: PlanDay): QueueItem[] {
  const queue: QueueItem[] = []
  for (const pe of planDay.exercises) {
    for (let i = 1; i <= pe.targetSets; i++) {
      queue.push({ exerciseId: pe.exerciseId, setNumber: i, targetSets: pe.targetSets })
    }
  }
  return queue
}

export function ActiveWorkout({
  planDay,
  exercises,
  sessions,
  recovery,
  date,
  activePlanId,
  onFinish,
  onCancel,
}: Props) {
  const { weightUnit } = useSettings()
  const [queue, setQueue] = useState<QueueItem[]>(() => buildQueue(planDay))
  const [stepIndex, setStepIndex] = useState(0)
  const [logged, setLogged] = useState<LoggedExercise[]>([])
  const [form, setForm] = useState({ weight: 0, reps: 0, rpe: 8 })
  const [notes, setNotes] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)

  const current = queue[stepIndex]
  const currentExercise = current ? exercises.find((e) => e.id === current.exerciseId) : undefined
  const suggestion = useMemo(
    () => (currentExercise ? suggestNextSession(currentExercise, sessions) : null),
    [currentExercise, sessions],
  )

  // Prefill weight/reps from the suggestion whenever a new exercise starts.
  useEffect(() => {
    if (suggestion) {
      setForm({ weight: suggestion.suggestedWeight, reps: suggestion.suggestedReps, rpe: 8 })
    } else {
      setForm({ weight: 0, reps: 0, rpe: 8 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.exerciseId])

  function logSet() {
    if (!current) return
    setLogged((prev) => {
      const existing = prev.find((l) => l.exerciseId === current.exerciseId)
      const newSet: SetEntry = { ...form }
      if (existing) {
        return prev.map((l) => (l.exerciseId === current.exerciseId ? { ...l, sets: [...l.sets, newSet] } : l))
      }
      return [...prev, { exerciseId: current.exerciseId, sets: [newSet] }]
    })
    setStepIndex((i) => i + 1)
  }

  function skipRestOfExercise() {
    if (!current) return
    const nextIndex = queue.findIndex((q, i) => i > stepIndex && q.exerciseId !== current.exerciseId)
    setStepIndex(nextIndex === -1 ? queue.length : nextIndex)
  }

  function addPlannedSet() {
    if (!current) return
    const exerciseId = current.exerciseId
    setQueue((prev) => {
      const lastIdx = prev.map((q) => q.exerciseId).lastIndexOf(exerciseId)
      const newTotal = prev.filter((q) => q.exerciseId === exerciseId).length + 1
      const updated = prev.map((q) => (q.exerciseId === exerciseId ? { ...q, targetSets: newTotal } : q))
      const newItem: QueueItem = { exerciseId, setNumber: newTotal, targetSets: newTotal }
      return [...updated.slice(0, lastIdx + 1), newItem, ...updated.slice(lastIdx + 1)]
    })
  }

  function removePlannedSet() {
    if (!current) return
    const exerciseId = current.exerciseId
    setQueue((prev) => {
      const lastIdx = prev.map((q) => q.exerciseId).lastIndexOf(exerciseId)
      if (lastIdx <= stepIndex) return prev
      const newTotal = prev.filter((q) => q.exerciseId === exerciseId).length - 1
      const next = prev.filter((_, i) => i !== lastIdx)
      return next.map((q) => (q.exerciseId === exerciseId ? { ...q, targetSets: newTotal } : q))
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
    onFinish({
      id: crypto.randomUUID(),
      date,
      recovery,
      exercises: logged,
      notes: notes.trim() || undefined,
      planId: activePlanId,
      planDayId: planDay.id,
    })
  }

  if (!current) {
    return (
      <div className="panel">
        <h2>{planDay.label}: workout complete</h2>
        {logged.length === 0 && <p className="muted">Nothing logged yet.</p>}
        {logged.map((l) => {
          const ex = exercises.find((e) => e.id === l.exerciseId)
          const priorBest = maxWeightEver(sessions, l.exerciseId)
          return (
            <div key={l.exerciseId} className="plan-day-editor">
              <h3>{ex?.name ?? 'Unknown exercise'}</h3>
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
                  {l.sets.map((s, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        {formatWeight(s.weight, weightUnit)}
                        {s.weight > priorBest && <span className="pr-badge">PR</span>}
                      </td>
                      <td>{s.reps}</td>
                      <td>{s.rpe}</td>
                      <td>
                        <button className="link-btn" onClick={() => removeSet(l.exerciseId, i)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        <label className="session-notes-field">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Anything to remember for next time?"
            rows={3}
          />
        </label>

        <div className="wizard-actions">
          <button type="button" className="link-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={finish} disabled={logged.length === 0}>
            Finish workout
          </button>
        </div>
      </div>
    )
  }

  const exerciseNumber = planDay.exercises.findIndex((pe) => pe.exerciseId === current.exerciseId) + 1
  const currentExerciseLog = logged.find((l) => l.exerciseId === current.exerciseId)
  const priorBest = maxWeightEver(sessions, current.exerciseId)
  const lastQueueIndexForExercise = queue.map((q) => q.exerciseId).lastIndexOf(current.exerciseId)
  const canRemovePlannedSet = lastQueueIndexForExercise > stepIndex

  return (
    <div className="panel active-workout">
      <div className="workout-progress muted">
        Exercise {exerciseNumber} of {planDay.exercises.length}
      </div>
      <h2>{currentExercise?.name ?? 'Unknown exercise'}</h2>
      <div className="set-count-row">
        <p className="muted">
          Set {current.setNumber} of {current.targetSets}
        </p>
        <div className="set-count-buttons">
          <button
            type="button"
            className="link-btn"
            onClick={removePlannedSet}
            disabled={!canRemovePlannedSet}
            title="Remove a set from this exercise"
          >
            − set
          </button>
          <button type="button" className="link-btn" onClick={addPlannedSet} title="Add a set to this exercise">
            + set
          </button>
        </div>
      </div>

      {suggestion && <SuggestionCard suggestion={suggestion} />}

      <RestTimer />

      {notesOpen || notes ? (
        <label className="session-notes-field">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Anything to remember for next time?"
            rows={2}
          />
        </label>
      ) : (
        <button type="button" className="link-btn add-note-btn" onClick={() => setNotesOpen(true)}>
          + Add a note
        </button>
      )}

      {currentExerciseLog && currentExerciseLog.sets.length > 0 && (
        <table className="set-table">
          <thead>
            <tr>
              <th>Set</th>
              <th>Weight</th>
              <th>Reps</th>
              <th>RPE</th>
            </tr>
          </thead>
          <tbody>
            {currentExerciseLog.sets.map((s, i) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="set-form">
        <label>
          Weight
          <input
            type="number"
            step={0.5}
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
          />
        </label>
        <label>
          Reps
          <input
            type="number"
            min={0}
            value={form.reps}
            onChange={(e) => setForm({ ...form, reps: Number(e.target.value) })}
          />
        </label>
        <label>
          RPE
          <input
            type="number"
            min={1}
            max={10}
            value={form.rpe}
            onChange={(e) => setForm({ ...form, rpe: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="wizard-actions">
        <div>
          <button type="button" className="link-btn" onClick={onCancel}>
            Cancel workout
          </button>
          {current.setNumber < current.targetSets || exerciseNumber < planDay.exercises.length ? (
            <button type="button" className="link-btn" onClick={skipRestOfExercise}>
              Skip rest of exercise
            </button>
          ) : null}
        </div>
        <button type="button" className="primary" onClick={logSet}>
          Log set
        </button>
      </div>
    </div>
  )
}
