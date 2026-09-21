import { useState } from 'react'
import type { Exercise, WorkoutPlan, WorkoutSession } from '../types'
import { buildMonthCalendar } from '../lib/calendar'
import { MonthCalendarGrid } from './MonthCalendarGrid'
import { DayWorkoutModal } from './DayWorkoutModal'

interface Props {
  plan: WorkoutPlan
  sessions: WorkoutSession[]
  exercises: Exercise[]
}

export function PlanCalendar({ plan, sessions, exercises }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const weeks = buildMonthCalendar(sessions, year, month, { plan, allPlans: [plan] })

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <>
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
    </>
  )
}
