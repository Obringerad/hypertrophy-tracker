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
