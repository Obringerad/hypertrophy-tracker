import { useState } from 'react'
import type { Exercise, SetEntry, WorkoutPlan, WorkoutSession } from '../types'
import { formatDate } from '../lib/dates'
import { maxWeightEver } from '../lib/records'
import { formatWeight } from '../lib/units'
import { useSettings } from '../context/SettingsContext'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  plans: WorkoutPlan[]
  onDelete: (sessionId: string) => void
  onUpdateExerciseSets: (sessionId: string, exerciseId: string, sets: SetEntry[]) => void
}

function planDayLabel(session: WorkoutSession, plans: WorkoutPlan[]): string | undefined {
  if (!session.planId || !session.planDayId) return undefined
  const plan = plans.find((p) => p.id === session.planId)
  return plan?.days.find((d) => d.id === session.planDayId)?.label
}

function logKey(sessionId: string, exerciseId: string): string {
  return `${sessionId}:${exerciseId}`
}

export function HistoryView({ exercises, sessions, plans, onDelete, onUpdateExerciseSets }: Props) {
  const { weightUnit } = useSettings()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draftSets, setDraftSets] = useState<SetEntry[]>([])

  const sorted = sessions.slice().sort((a, b) => b.date.localeCompare(a.date))

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function startEdit(sessionId: string, exerciseId: string, sets: SetEntry[]) {
    setEditingKey(logKey(sessionId, exerciseId))
    setDraftSets(sets.map((s) => ({ ...s })))
  }

  function cancelEdit() {
    setEditingKey(null)
    setDraftSets([])
  }

  function saveEdit(sessionId: string, exerciseId: string) {
    onUpdateExerciseSets(sessionId, exerciseId, draftSets)
    setEditingKey(null)
    setDraftSets([])
  }

  function updateDraftSet(index: number, field: keyof SetEntry, value: number) {
    setDraftSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  if (sessions.length === 0) {
    return (
      <div className="panel">
        <h2>History</h2>
        <p className="muted">No workouts logged yet.</p>
      </div>
    )
  }

  return (
    <div className="panel">
      <h2>History</h2>
      <div className="history-list">
        {sorted.map((session) => {
          const isOpen = expanded.has(session.id)
          const dayLabel = planDayLabel(session, plans)
          return (
            <div key={session.id} className="history-entry">
              <div className="history-entry-header">
                <button type="button" className="history-toggle" onClick={() => toggle(session.id)}>
                  <span className={`history-caret ${isOpen ? 'open' : ''}`}>&#9656;</span>
                  <span className="history-entry-date">{formatDate(session.date)}</span>
                  {dayLabel && <span className="muted">{dayLabel}</span>}
                  <span className="muted">
                    {session.exercises.length} exercise{session.exercises.length === 1 ? '' : 's'} &middot; Recovery{' '}
                    {session.recovery}/5
                  </span>
                </button>
                <button type="button" className="btn-delete" onClick={() => onDelete(session.id)}>
                  Delete
                </button>
              </div>

              {isOpen && (
                <div className="history-entry-body">
                  {session.notes && <p className="history-entry-notes muted">"{session.notes}"</p>}
                  {session.exercises.map((log) => {
                    const exercise = exercises.find((e) => e.id === log.exerciseId)
                    const key = logKey(session.id, log.exerciseId)
                    const isEditing = editingKey === key
                    const priorBest = maxWeightEver(sessions, log.exerciseId)
                    return (
                      <div key={log.exerciseId} className="plan-day-editor">
                        <div className="exercise-log-header">
                          <h3>{exercise?.name ?? 'Unknown exercise'}</h3>
                          {isEditing ? (
                            <div className="exercise-log-actions">
                              <button type="button" className="link-btn" onClick={cancelEdit}>
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="link-btn"
                                onClick={() => saveEdit(session.id, log.exerciseId)}
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() => startEdit(session.id, log.exerciseId, log.sets)}
                            >
                              Edit
                            </button>
                          )}
                        </div>
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
                            {(isEditing ? draftSets : log.sets).map((s, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                {isEditing ? (
                                  <>
                                    <td>
                                      <input
                                        type="number"
                                        step={0.5}
                                        value={s.weight}
                                        onChange={(e) => updateDraftSet(i, 'weight', Number(e.target.value))}
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        min={0}
                                        value={s.reps}
                                        onChange={(e) => updateDraftSet(i, 'reps', Number(e.target.value))}
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={s.rpe}
                                        onChange={(e) => updateDraftSet(i, 'rpe', Number(e.target.value))}
                                      />
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td>
                                      {formatWeight(s.weight, weightUnit)}
                                      {s.weight > 0 && s.weight === priorBest && (
                                        <span className="pr-badge">PR</span>
                                      )}
                                    </td>
                                    <td>{s.reps}</td>
                                    <td>{s.rpe}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
