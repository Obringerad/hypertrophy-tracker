import type { WorkoutPlan, WorkoutSession } from '../types'

export interface CalendarDay {
  iso: string
  dayOfMonth: number
  isToday: boolean
  isCurrentMonth: boolean
  isScheduled: boolean
  /** One label per session logged that day (usually 0 or 1, but more than one plan/session can land on the same date). */
  labels: string[]
}

interface BuildMonthCalendarOptions {
  /** Restrict to this plan's sessions and its fixed-day scheduling. Omit to combine sessions across all plans. */
  plan?: WorkoutPlan
  /** All saved plans, used to resolve each session's plan-day label. */
  allPlans: WorkoutPlan[]
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sessionLabel(session: WorkoutSession, allPlans: WorkoutPlan[], disambiguate: boolean): string {
  const plan = allPlans.find((p) => p.id === session.planId)
  const day = plan?.days.find((d) => d.id === session.planDayId)
  const base = day?.label ?? 'Extra Workout'
  return disambiguate && plan ? `${plan.name}: ${base}` : base
}

/** A month grid (weeks of 7 days, padded with adjacent-month days) for a calendar view. */
export function buildMonthCalendar(
  sessions: WorkoutSession[],
  year: number,
  month: number,
  { plan, allPlans }: BuildMonthCalendarOptions,
): CalendarDay[][] {
  const relevant = plan ? sessions.filter((s) => s.planId === plan.id) : sessions
  const sessionsByDate = new Map<string, WorkoutSession[]>()
  for (const s of relevant) {
    const list = sessionsByDate.get(s.date) ?? []
    list.push(s)
    sessionsByDate.set(s.date, list)
  }

  const disambiguate = !plan && allPlans.length > 1
  const todayIso = toIso(new Date())
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function dayCell(d: Date, isCurrentMonth: boolean): CalendarDay {
    const iso = toIso(d)
    const daySessions = sessionsByDate.get(iso) ?? []
    const isScheduled = plan?.scheduleType === 'fixed' && (plan.fixedDays ?? []).includes(d.getDay())
    return {
      iso,
      dayOfMonth: d.getDate(),
      isToday: iso === todayIso,
      isCurrentMonth,
      isScheduled: Boolean(isScheduled),
      labels: daySessions.map((s) => sessionLabel(s, allPlans, disambiguate)),
    }
  }

  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7
  const gridStart = new Date(year, month, 1 - startWeekday)
  const cells: CalendarDay[] = []
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    cells.push(dayCell(d, d.getMonth() === month))
  }

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
