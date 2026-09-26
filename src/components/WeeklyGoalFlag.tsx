import type { WeeklyGoalStatus } from '../lib/planProgress'

interface Props {
  status: WeeklyGoalStatus
}

export function WeeklyGoalFlag({ status }: Props) {
  const { targetSessions, sessionsThisWeek, met, atRisk } = status
  const className = ['weekly-goal-flag', met ? 'met' : atRisk ? 'at-risk' : 'on-track'].join(' ')

  if (met) {
    return <div className={className}>All workouts completed this week</div>
  }

  return (
    <div className={className}>
      {sessionsThisWeek}/{targetSessions} sessions this week
    </div>
  )
}
