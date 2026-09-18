import { useState } from 'react'
import type { Exercise, WorkoutPlan, WorkoutSession } from '../types'
import { formatDate } from '../lib/dates'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  plans: WorkoutPlan[]
  onDelete: (sessionId: string) => void
}

function planDayLabel(session: WorkoutSession, plans: WorkoutPlan[]): string | undefined {
  if (!session.planId || !session.planDayId) return undefined
  const plan = plans.find((p) => p.id === session.planId)
  return plan?.days.find((d) => d.id === session.planDayId)?.label
}

export function HistoryView({ exercises, sessions, plans, onDelete }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const sorted = sessions.slice().sort((a, b) => b.date.localeCompare(a.date))

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
              <button type="button" className="history-entry-header" onClick={() => toggle(session.id)}>
                <span className={`history-caret ${isOpen ? 'open' : ''}`}>&#9656;</span>
                <span className="history-entry-date">{formatDate(session.date)}</span>
                {dayLabel && <span className="muted">{dayLabel}</span>}
                <span className="muted">
                  {session.exercises.length} exercise{session.exercises.length === 1 ? '' : 's'} &middot; Recovery{' '}
                  {session.recovery}/5
                </span>
              </button>

              {isOpen && (
                <div className="history-entry-body">
                  {session.exercises.map((log) => {
                    const exercise = exercises.find((e) => e.id === log.exerciseId)
                    return (
                      <div key={log.exerciseId} className="plan-day-editor">
                        <h3>{exercise?.name ?? 'Unknown exercise'}</h3>
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
                            {log.sets.map((s, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{s.weight}</td>
                                <td>{s.reps}</td>
                                <td>{s.rpe}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                  <button type="button" className="link-btn danger" onClick={() => onDelete(session.id)}>
                    Delete workout
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
