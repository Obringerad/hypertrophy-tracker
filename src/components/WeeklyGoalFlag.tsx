import type { WeeklyGoalStatus } from '../lib/planProgress'

interface Props {
  status: WeeklyGoalStatus
}

export function WeeklyGoalFlag({ status }: Props) {
  const { daysPerWeek, sessionsThisWeek, daysRemainingInWeek, sessionsRemaining, met, atRisk } = status
  const dayWord = (n: number) => `${n} day${n === 1 ? '' : 's'}`
  const sessionWord = (n: number) => `${n} session${n === 1 ? '' : 's'}`

  const className = ['weekly-goal-flag', met ? 'met' : atRisk ? 'at-risk' : 'on-track'].join(' ')

  let message: string
  if (met) {
    message = `Goal met — ${sessionsThisWeek}/${daysPerWeek} sessions logged this week`
  } else if (atRisk) {
    message = `Goal at risk — ${sessionWord(sessionsRemaining)} still needed but only ${dayWord(
      daysRemainingInWeek,
    )} left this week`
  } else {
    message = `${sessionWord(sessionsRemaining)} left to hit your ${daysPerWeek}/week goal — ${dayWord(
      daysRemainingInWeek,
    )} remaining this week`
  }

  return <div className={className}>{message}</div>
}
