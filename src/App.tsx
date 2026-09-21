import { useRef, useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { Exercise, SetEntry, WorkoutPlan, WorkoutSession } from './types'
import { ExerciseManager } from './components/ExerciseManager'
import { HomeTab } from './components/HomeTab'
import { WorkoutLogger } from './components/WorkoutLogger'
import { HistoryView } from './components/HistoryView'
import { CalendarTab } from './components/CalendarTab'
import { PlanSetup } from './components/PlanSetup'
import { PlansList } from './components/PlansList'
import { PlanDetail } from './components/PlanDetail'
import { Toast } from './components/Toast'
import { advancePlanRotation, resolveTodaysPlanDay } from './lib/planEngine'
import { formatDate } from './lib/dates'
import './App.css'

type Tab = 'home' | 'log' | 'history' | 'calendar' | 'plans' | 'exercises'

const UNDO_WINDOW_MS = 6000

interface UndoAction {
  message: string
  undo: () => void
}

export default function App() {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>('hypertrophy.exercises', [])
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>('hypertrophy.sessions', [])
  const [plans, setPlans] = useLocalStorage<WorkoutPlan[]>('hypertrophy.plans', [])
  const [activePlanId, setActivePlanId] = useLocalStorage<string | null>('hypertrophy.activePlanId', null)
  const [tab, setTab] = useState<Tab>('home')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [creatingPlan, setCreatingPlan] = useState(plans.length === 0)
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null)
  const undoTimeoutRef = useRef<number | null>(null)

  function pushUndo(message: string, undo: () => void) {
    if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current)
    setUndoAction({ message, undo })
    undoTimeoutRef.current = window.setTimeout(() => setUndoAction(null), UNDO_WINDOW_MS)
  }

  function dismissUndo() {
    if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current)
    setUndoAction(null)
  }

  const activePlan = plans.find((p) => p.id === activePlanId) ?? null
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [...prev, exercise])
  }

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id))
  }

  function updateExercise(updated: Exercise) {
    setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  function saveSession(session: WorkoutSession) {
    setSessions((prev) => [...prev, session])
    if (activePlan) {
      setPlans((prev) => prev.map((p) => (p.id === activePlan.id ? advancePlanRotation(p) : p)))
      setSelectedPlanId(activePlan.id)
      setCreatingPlan(false)
      setTab('plans')
    }
  }

  function savePlan(newPlan: WorkoutPlan, newExercises: Exercise[]) {
    if (newExercises.length > 0) setExercises((prev) => [...prev, ...newExercises])
    setPlans((prev) => [...prev, newPlan])
    setActivePlanId(newPlan.id)
    setCreatingPlan(false)
    setSelectedPlanId(newPlan.id)
    setTab('log')
  }

  function updatePlan(updated: WorkoutPlan, newExercises?: Exercise[]) {
    if (newExercises && newExercises.length > 0) setExercises((prev) => [...prev, ...newExercises])
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  function deletePlan(planId: string) {
    const index = plans.findIndex((p) => p.id === planId)
    if (index === -1) return
    const plan = plans[index]
    if (!window.confirm(`Delete "${plan.name}"? This can't be undone.`)) return

    const wasActive = activePlanId === planId
    setPlans((prev) => prev.filter((p) => p.id !== planId))
    if (wasActive) setActivePlanId(null)
    setSelectedPlanId(null)

    pushUndo(`Deleted "${plan.name}"`, () => {
      setPlans((prev) => {
        const next = [...prev]
        next.splice(index, 0, plan)
        return next
      })
      if (wasActive) setActivePlanId(plan.id)
    })
  }

  function deleteSession(sessionId: string) {
    const index = sessions.findIndex((s) => s.id === sessionId)
    if (index === -1) return
    const session = sessions[index]

    setSessions((prev) => prev.filter((s) => s.id !== sessionId))

    pushUndo(`Deleted workout from ${formatDate(session.date)}`, () => {
      setSessions((prev) => {
        const next = [...prev]
        next.splice(index, 0, session)
        return next
      })
    })
  }

  function updateExerciseSets(sessionId: string, exerciseId: string, sets: SetEntry[]) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, exercises: s.exercises.map((log) => (log.exerciseId === exerciseId ? { ...log, sets } : log)) }
          : s,
      ),
    )
  }

  const todaysPlanDay = activePlan ? resolveTodaysPlanDay(activePlan) : null

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Hypertrophy Tracker {/* TEMP dev marker, delete this span + .dev-deploy-marker CSS when done testing deploys */}
          <span className="dev-deploy-marker" />
        </h1>
        <nav className="tabs">
          <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
            Home
          </button>
          <button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>
            Log Workout
          </button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            History
          </button>
          <button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>
            Calendar
          </button>
          <button
            className={tab === 'plans' ? 'active' : ''}
            onClick={() => {
              setTab('plans')
              setSelectedPlanId(null)
              setCreatingPlan(false)
            }}
          >
            Plans
          </button>
          <button className={tab === 'exercises' ? 'active' : ''} onClick={() => setTab('exercises')}>
            Exercises
          </button>
        </nav>
      </header>

      <main>
        {tab === 'home' && (
          <HomeTab
            plans={plans}
            sessions={sessions}
            exercises={exercises}
            activePlanId={activePlanId}
            onGoToLog={() => setTab('log')}
            onSetActivePlan={setActivePlanId}
            onCreatePlan={() => {
              setTab('plans')
              setSelectedPlanId(null)
              setCreatingPlan(true)
            }}
          />
        )}
        {tab === 'log' && (
          <WorkoutLogger
            exercises={exercises}
            sessions={sessions}
            onSave={saveSession}
            planDay={todaysPlanDay}
            activePlanId={activePlan?.id}
          />
        )}
        {tab === 'history' && (
          <HistoryView
            exercises={exercises}
            sessions={sessions}
            plans={plans}
            onDelete={deleteSession}
            onUpdateExerciseSets={updateExerciseSets}
          />
        )}
        {tab === 'calendar' && <CalendarTab plans={plans} sessions={sessions} exercises={exercises} />}
        {tab === 'plans' &&
          (creatingPlan ? (
            <PlanSetup
              existingExercises={exercises}
              onSave={savePlan}
              onCancel={plans.length > 0 ? () => setCreatingPlan(false) : undefined}
            />
          ) : selectedPlan ? (
            <PlanDetail
              plan={selectedPlan}
              exercises={exercises}
              sessions={sessions}
              isActive={selectedPlan.id === activePlanId}
              onSetActive={() => setActivePlanId(selectedPlan.id)}
              onDelete={() => deletePlan(selectedPlan.id)}
              onUpdatePlan={updatePlan}
              onBack={() => setSelectedPlanId(null)}
            />
          ) : (
            <PlansList
              plans={plans}
              sessions={sessions}
              activePlanId={activePlanId}
              onOpen={setSelectedPlanId}
              onNew={() => setCreatingPlan(true)}
            />
          ))}
        {tab === 'exercises' && (
          <ExerciseManager
            exercises={exercises}
            onAdd={addExercise}
            onRemove={removeExercise}
            onUpdate={updateExercise}
          />
        )}
      </main>

      {undoAction && (
        <Toast
          message={undoAction.message}
          actionLabel="Undo"
          onAction={() => {
            undoAction.undo()
            dismissUndo()
          }}
          onDismiss={dismissUndo}
        />
      )}
    </div>
  )
}
