import type { CalendarDay } from '../lib/calendar'

interface Props {
  year: number
  month: number
  weeks: CalendarDay[][]
  onPrevMonth: () => void
  onNextMonth: () => void
  onDayClick?: (iso: string) => void
}

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function MonthCalendarGrid({ year, month, weeks, onPrevMonth, onNextMonth, onDayClick }: Props) {
  return (
    <div className="plan-calendar">
      <div className="calendar-nav">
        <button type="button" className="link-btn" onClick={onPrevMonth}>
          &lt;
        </button>
        <strong>
          {MONTH_NAMES[month]} {year}
        </strong>
        <button type="button" className="link-btn" onClick={onNextMonth}>
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
          {week.map((day) => {
            const hasSessions = day.labels.length > 0
            const clickable = hasSessions && !!onDayClick
            return (
              <div
                key={day.iso}
                className={[
                  'calendar-cell',
                  day.isCurrentMonth ? '' : 'outside-month',
                  day.isToday ? 'today' : '',
                  hasSessions ? 'logged' : '',
                  day.isScheduled && !hasSessions ? 'scheduled' : '',
                  clickable ? 'clickable' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={hasSessions ? day.labels.join(', ') : day.isScheduled ? 'Scheduled' : undefined}
                onClick={clickable ? () => onDayClick!(day.iso) : undefined}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onDayClick!(day.iso)
                        }
                      }
                    : undefined
                }
              >
                <span className="calendar-date">{day.dayOfMonth}</span>
                {day.labels.map((label, idx) => (
                  <span key={idx} className="calendar-day-label">
                    {label}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
