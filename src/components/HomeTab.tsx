import { useState } from 'react'
import type { Exercise, WorkoutPlan, WorkoutSession } from '../types'
import { buildMonthCalendar } from '../lib/calendar'
import { MonthCalendarGrid } from './MonthCalendarGrid'
import { ProgressGraphs } from './ProgressGraphs'

interface Props {
  plans: WorkoutPlan[]
  sessions: WorkoutSession[]
  exercises: Exercise[]
  activePlanId: string | null
  onGoToLog: () => void
  onSetActivePlan: (planId: string) => void
  onCreatePlan: () => void
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function HomeTab({
  plans,
  sessions,
  exercises,
  activePlanId,
  onGoToLog,
  onSetActivePlan,
  onCreatePlan,
}: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedPlanId, setSelectedPlanId] = useState('all')

  const selectedPlan = selectedPlanId === 'all' ? undefined : plans.find((p) => p.id === selectedPlanId)
  const weeks = buildMonthCalendar(sessions, year, month, { plan: selectedPlan, allPlans: plans })

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <div className="panel home-tab">
      <div className="home-header">
        <p className="workout-home-date">{formatToday()}</p>

        {plans.length === 0 ? (
          <div className="home-plan-picker">
            <p className="muted">No plan yet</p>
            <button type="button" className="choice-btn" onClick={onCreatePlan}>
              Create a plan
            </button>
          </div>
        ) : (
          <div className="home-plan-picker">
            <label className="plan-name-field home-active-plan-field">
              Active plan
              <select value={activePlanId ?? ''} onChange={(e) => onSetActivePlan(e.target.value)}>
                {!activePlanId && (
                  <option value="" disabled>
                    Select a plan
                  </option>
                )}
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="link-btn" onClick={onCreatePlan}>
              + New plan
            </button>
          </div>
        )}

        <button type="button" className="primary start-workout-btn" onClick={onGoToLog}>
          Log Workout
        </button>
      </div>

      {sessions.length === 0 && plans.length === 0 ? (
        <p className="muted">Set up a plan and log your first workout to start seeing your calendar here.</p>
      ) : (
        <>
          {plans.length > 0 && (
            <div className="exercise-picker home-calendar-picker">
              <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                <option value="all">All plans combined</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <MonthCalendarGrid
            year={year}
            month={month}
            weeks={weeks}
            onPrevMonth={() => shiftMonth(-1)}
            onNextMonth={() => shiftMonth(1)}
          />
        </>
      )}

      <ProgressGraphs exercises={exercises} sessions={sessions} />
    </div>
  )
}
