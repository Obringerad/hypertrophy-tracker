import { useState } from 'react'
import type { WorkoutPlan, WorkoutSession } from '../types'
import { buildMonthCalendar } from '../lib/planProgress'

interface Props {
  plan: WorkoutPlan
  sessions: WorkoutSession[]
}

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function PlanCalendar({ plan, sessions }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const weeks = buildMonthCalendar(plan, sessions, year, month)

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <div className="plan-calendar">
      <div className="calendar-nav">
        <button type="button" className="link-btn" onClick={() => shiftMonth(-1)}>
          &lt;
        </button>
        <strong>
          {MONTH_NAMES[month]} {year}
        </strong>
        <button type="button" className="link-btn" onClick={() => shiftMonth(1)}>
          &gt;
        </button>
      </div>
      <div className="calendar-grid calendar-headers">
        {WEEKDAY_HEADERS.map((label, i) => (
          <div key={i} className="calendar-header-cell">
            {label}
          </div>
        ))}
      </div>
      {weeks.map((week, i) => (
        <div className="calendar-grid" key={i}>
          {week.map((day) => (
            <div
              key={day.iso}
              className={[
                'calendar-cell',
                day.isCurrentMonth ? '' : 'outside-month',
                day.isToday ? 'today' : '',
                day.sessionLabel ? 'logged' : '',
                day.isScheduled && !day.sessionLabel ? 'scheduled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={day.sessionLabel ?? (day.isScheduled ? 'Scheduled' : undefined)}
            >
              <span className="calendar-date">{day.dayOfMonth}</span>
              {day.sessionLabel && <span className="calendar-day-label">{day.sessionLabel}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
