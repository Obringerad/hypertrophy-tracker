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

export interface WeeklyGoalStatus {
  daysPerWeek: number
  sessionsThisWeek: number
  /** Days left in the calendar week (Sun-Sat), including today. */
  daysRemainingInWeek: number
  sessionsRemaining: number
  met: boolean
  /** Not enough days left in the week to still hit the goal. */
  atRisk: boolean
}

/** How a flexible-schedule plan is tracking against its days/week goal for the current calendar week. */
export function weeklyGoalStatus(
  plan: WorkoutPlan,
  sessions: WorkoutSession[],
  today: Date = new Date(),
): WeeklyGoalStatus | null {
  if (plan.scheduleType !== 'flexible' || !plan.daysPerWeek) return null

  const todayStripped = stripTime(today)
  const dayOfWeek = todayStripped.getDay()
  const weekStart = new Date(todayStripped)
  weekStart.setDate(weekStart.getDate() - dayOfWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const sessionsThisWeek = sessionsForPlan(sessions, plan.id).filter((s) => {
    const d = parseIsoDate(s.date)
    return d >= weekStart && d <= weekEnd
  }).length

  const daysRemainingInWeek = 7 - dayOfWeek
  const sessionsRemaining = Math.max(0, plan.daysPerWeek - sessionsThisWeek)

  return {
    daysPerWeek: plan.daysPerWeek,
    sessionsThisWeek,
    daysRemainingInWeek,
    sessionsRemaining,
    met: sessionsRemaining === 0,
    atRisk: sessionsRemaining > 0 && sessionsRemaining > daysRemainingInWeek,
  }
}
