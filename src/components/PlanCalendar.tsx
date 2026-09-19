import { useState } from 'react'
import type { WorkoutPlan, WorkoutSession } from '../types'
import { buildMonthCalendar } from '../lib/calendar'
import { MonthCalendarGrid } from './MonthCalendarGrid'

interface Props {
  plan: WorkoutPlan
  sessions: WorkoutSession[]
}

export function PlanCalendar({ plan, sessions }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const weeks = buildMonthCalendar(sessions, year, month, { plan, allPlans: [plan] })

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <MonthCalendarGrid
      year={year}
      month={month}
      weeks={weeks}
      onPrevMonth={() => shiftMonth(-1)}
      onNextMonth={() => shiftMonth(1)}
    />
  )
}
