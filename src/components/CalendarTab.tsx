import { useState } from 'react'
import type { Exercise, WorkoutPlan, WorkoutSession } from '../types'
import { buildMonthCalendar } from '../lib/calendar'
import { MonthCalendarGrid } from './MonthCalendarGrid'
import { DayWorkoutModal } from './DayWorkoutModal'

interface Props {
  plans: WorkoutPlan[]
  sessions: WorkoutSession[]
  exercises: Exercise[]
}

export function CalendarTab({ plans, sessions, exercises }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedPlanId, setSelectedPlanId] = useState('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const selectedPlan = selectedPlanId === 'all' ? undefined : plans.find((p) => p.id === selectedPlanId)
  const weeks = buildMonthCalendar(sessions, year, month, { plan: selectedPlan, allPlans: plans })

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <div className="panel">
      <h2>Calendar</h2>

      {plans.length > 0 && (
        <div className="exercise-picker">
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
        onDayClick={setSelectedDate}
      />

      {selectedDate && (
        <DayWorkoutModal
          date={selectedDate}
          sessions={sessions.filter((s) => s.date === selectedDate)}
          exercises={exercises}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
