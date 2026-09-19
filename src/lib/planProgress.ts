import type { WorkoutPlan, WorkoutSession } from '../types'

export function expectedSessionsPerWeek(plan: WorkoutPlan): number {
  return plan.scheduleType === 'fixed' ? (plan.fixedDays ?? []).length : (plan.daysPerWeek ?? 0)
}

export function sessionsForPlan(sessions: WorkoutSession[], planId: string): WorkoutSession[] {
  return sessions.filter((s) => s.planId === planId)
}

export interface PlanProgress {
  completedSessions: number
  week: number
  totalWeeks?: number
  expectedTotalSessions?: number
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function planProgress(plan: WorkoutPlan, sessions: WorkoutSession[], today: Date = new Date()): PlanProgress {
  const completedSessions = sessionsForPlan(sessions, plan.id).length
  const start = parseIsoDate(plan.startDate)
  const daysSinceStart = Math.floor((stripTime(today).getTime() - start.getTime()) / 86_400_000)
  const rawWeek = Math.max(1, Math.floor(daysSinceStart / 7) + 1)
  const totalWeeks = plan.durationWeeks
  const week = totalWeeks ? Math.min(rawWeek, totalWeeks) : rawWeek
  const expectedTotalSessions = totalWeeks ? totalWeeks * expectedSessionsPerWeek(plan) : undefined
  return { completedSessions, week, totalWeeks, expectedTotalSessions }
}

export interface CalendarDay {
  iso: string
  dayOfMonth: number
  isToday: boolean
  isCurrentMonth: boolean
  isScheduled: boolean
  /** Label to show for a logged session that day: its plan day's name, or a generic fallback for an off-schedule/freeform session. */
  sessionLabel?: string
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** A month grid (weeks of 7 days, padded with adjacent-month days) for the plan's calendar view. */
export function buildMonthCalendar(
  plan: WorkoutPlan,
  sessions: WorkoutSession[],
  year: number,
  month: number,
): CalendarDay[][] {
  const sessionByDate = new Map(sessionsForPlan(sessions, plan.id).map((s) => [s.date, s]))
  const todayIso = toIso(new Date())
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function dayCell(d: Date, isCurrentMonth: boolean): CalendarDay {
    const iso = toIso(d)
    const session = sessionByDate.get(iso)
    const planDay = session?.planDayId ? plan.days.find((pd) => pd.id === session.planDayId) : undefined
    const isScheduled = plan.scheduleType === 'fixed' && (plan.fixedDays ?? []).includes(d.getDay())
    return {
      iso,
      dayOfMonth: d.getDate(),
      isToday: iso === todayIso,
      isCurrentMonth,
      isScheduled,
      sessionLabel: session ? (planDay?.label ?? 'Workout') : undefined,
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
