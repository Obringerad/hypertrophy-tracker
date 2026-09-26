import { useEffect } from 'react'
import type { Exercise, WorkoutSession } from '../types'
import { formatDate } from '../lib/dates'
import { maxWeightEver } from '../lib/records'
import { formatWeight } from '../lib/units'
import { useSettings } from '../context/SettingsContext'

interface Props {
  date: string
  sessions: WorkoutSession[]
  exercises: Exercise[]
  onClose: () => void
}

export function DayWorkoutModal({ date, sessions, exercises, onClose }: Props) {
  const { weightUnit } = useSettings()
  const daySessions = sessions.filter((s) => s.date === date)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="panel modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{formatDate(date)}</h2>
          <button type="button" className="toast-dismiss" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {daySessions.length === 0 && <p className="muted">No workout logged this day.</p>}

        {daySessions.map((session) => (
          <div key={session.id} className="modal-session">
            <p className="muted">Recovery {session.recovery}/5</p>
            {session.notes && <p className="history-entry-notes muted">"{session.notes}"</p>}
            {session.exercises.map((log) => {
              const exercise = exercises.find((e) => e.id === log.exerciseId)
              const priorBest = maxWeightEver(sessions, log.exerciseId)
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
                          <td>
                            {formatWeight(s.weight, weightUnit)}
                            {s.weight > 0 && s.weight === priorBest && <span className="pr-badge">PR</span>}
                          </td>
                          <td>{s.reps}</td>
                          <td>{s.rpe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
