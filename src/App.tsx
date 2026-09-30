import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { Exercise, SetEntry, WorkoutPlan, WorkoutSession } from './types'
import { convertWeight, sessionUnit, type WeightUnit } from './lib/units'
import { ExerciseManager } from './components/ExerciseManager'
import { HomeTab } from './components/HomeTab'
import { WorkoutLogger } from './components/WorkoutLogger'
import { HistoryView } from './components/HistoryView'
import { CalendarTab } from './components/CalendarTab'
import { PlanSetup } from './components/PlanSetup'
import { PlansList } from './components/PlansList'
import { PlanDetail } from './components/PlanDetail'
import { Toast } from './components/Toast'
import { ConfirmDialog } from './components/ConfirmDialog'
import { SettingsTab } from './components/SettingsTab'
import { ToolsTab } from './components/ToolsTab'
import { GuideTab } from './components/GuideTab'
import { TabIcon, type TabIconName } from './components/TabIcon'
import { SettingsProvider } from './context/SettingsContext'
import { advancePlanRotation } from './lib/planEngine'
import { formatDate } from './lib/dates'
import './App.css'

type Tab = 'home' | 'log' | 'history' | 'calendar' | 'plans' | 'exercises' | 'tools' | 'guide' | 'settings'

const UNDO_WINDOW_MS = 6000

/** The bottom nav on mobile only has room for a handful of tabs before it gets cramped, so it
 * shows these plus a "More" button, with the rest tucked into a popover. */
const MOBILE_PRIMARY_TABS: { key: Tab; label: string; icon: TabIconName }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'log', label: 'Log', icon: 'log' },
  { key: 'plans', label: 'Plans', icon: 'plans' },
  { key: 'history', label: 'History', icon: 'history' },
]
const MOBILE_MORE_TABS: { key: Tab; label: string; icon: TabIconName }[] = [
  { key: 'calendar', label: 'Calendar', icon: 'calendar' },
  { key: 'exercises', label: 'Exercises', icon: 'exercises' },
  { key: 'tools', label: 'Tools', icon: 'tools' },
  { key: 'guide', label: 'Guide', icon: 'guide' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
]

interface UndoAction {
  id: string
  message: string
  undo: () => void
}

export default function App() {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>('hypertrophy.exercises', [])
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>('hypertrophy.sessions', [])
  const [plans, setPlans] = useLocalStorage<WorkoutPlan[]>('hypertrophy.plans', [])
  const [activePlanId, setActivePlanId] = useLocalStorage<string | null>('hypertrophy.activePlanId', null)
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const draft = window.localStorage.getItem('hypertrophy.workoutDraft')
      return draft && draft !== 'null' ? 'log' : 'home'
    } catch {
      return 'home'
    }
  })
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [creatingPlan, setCreatingPlan] = useState(plans.length === 0)
  // A queue rather than a single slot - deleting two things within the undo window used to silently
  // drop the first one's undo the moment the second delete happened, with no indication it happened.
  const [undoQueue, setUndoQueue] = useState<UndoAction[]>([])
  const undoTimeoutRef = useRef<number | null>(null)
  const [toolsPrefillWeight, setToolsPrefillWeight] = useState<number | null>(null)
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  function selectTab(key: Tab) {
    if (key === 'plans') {
      setSelectedPlanId(null)
      setCreatingPlan(false)
    }
    setTab(key)
    setMoreMenuOpen(false)
  }

  function showPlatesFor(weight: number) {
    setToolsPrefillWeight(weight)
    setTab('tools')
  }

  function pushUndo(message: string, undo: () => void) {
    setUndoQueue((prev) => [...prev, { id: crypto.randomUUID(), message, undo }])
  }

  function dismissUndo() {
    setUndoQueue((prev) => prev.slice(1))
  }

  // Gives whichever undo is currently shown its own full window, restarting it whenever a new one
  // reaches the front of the queue - including one that was queued up behind an earlier toast.
  const frontUndoId = undoQueue[0]?.id
  useEffect(() => {
    if (frontUndoId === undefined) return
    undoTimeoutRef.current = window.setTimeout(() => setUndoQueue((prev) => prev.slice(1)), UNDO_WINDOW_MS)
    return () => {
      if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current)
    }
  }, [frontUndoId])

  const activePlan = plans.find((p) => p.id === activePlanId) ?? null
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [...prev, exercise])
  }

  function removeExercise(id: string) {
    const index = exercises.findIndex((e) => e.id === id)
    if (index === -1) return
    const exercise = exercises[index]

    const usedInPlans = plans.filter((p) => p.days.some((d) => d.exercises.some((pe) => pe.exerciseId === id))).length
    const usedInSessions = sessions.filter((s) => s.exercises.some((log) => log.exerciseId === id)).length
    const usageParts: string[] = []
    if (usedInPlans > 0) usageParts.push(`${usedInPlans} plan${usedInPlans === 1 ? '' : 's'}`)
    if (usedInSessions > 0) usageParts.push(`${usedInSessions} logged session${usedInSessions === 1 ? '' : 's'}`)
    const message =
      usageParts.length > 0
        ? `"${exercise.name}" is used in ${usageParts.join(' and ')}. Those will show "Unknown exercise" if you remove it. Delete anyway?`
        : `Delete "${exercise.name}"? This can't be undone.`

    setConfirmState({
      message,
      onConfirm: () => {
        setExercises((prev) => prev.filter((e) => e.id !== id))
        pushUndo(`Deleted "${exercise.name}"`, () => {
          setExercises((prev) => {
            const next = [...prev]
            next.splice(index, 0, exercise)
            return next
          })
        })
      },
    })
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

  function savePlan(newPlan: WorkoutPlan, newExercises: Exercise[], updatedExercises?: Exercise[]) {
    if (newExercises.length > 0) setExercises((prev) => [...prev, ...newExercises])
    if (updatedExercises && updatedExercises.length > 0) {
      setExercises((prev) => prev.map((e) => updatedExercises.find((u) => u.id === e.id) ?? e))
    }
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

  function duplicatePlan(planId: string) {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return
    const newPlan: WorkoutPlan = {
      ...plan,
      id: crypto.randomUUID(),
      name: `${plan.name} (copy)`,
      days: plan.days.map((d) => ({ ...d, id: crypto.randomUUID() })),
      nextDayIndex: 0,
      startDate: new Date().toISOString().slice(0, 10),
    }
    setPlans((prev) => [...prev, newPlan])
    setSelectedPlanId(newPlan.id)
  }

  function deletePlan(planId: string) {
    const index = plans.findIndex((p) => p.id === planId)
    if (index === -1) return
    const plan = plans[index]

    setConfirmState({
      message: `Delete "${plan.name}"? This can't be undone.`,
      onConfirm: () => {
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
      },
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

  function changeWeightUnit(fromUnit: WeightUnit, toUnit: WeightUnit, convertHistory: boolean) {
    setExercises((prev) =>
      prev.map((e) => ({
        ...e,
        weightIncrement: convertWeight(e.weightIncrement, fromUnit, toUnit),
        startingWeight: e.startingWeight !== undefined ? convertWeight(e.startingWeight, fromUnit, toUnit) : undefined,
      })),
    )
    if (convertHistory) {
      setSessions((prev) =>
        prev.map((s) => {
          const unit = sessionUnit(s)
          return {
            ...s,
            unit: toUnit,
            exercises: s.exercises.map((log) => ({
              ...log,
              sets: log.sets.map((set) => ({ ...set, weight: convertWeight(set.weight, unit, toUnit) })),
            })),
          }
        }),
      )
    }
  }

  function importData(data: {
    exercises: Exercise[]
    sessions: WorkoutSession[]
    plans: WorkoutPlan[]
    activePlanId: string | null
  }) {
    setExercises(data.exercises)
    setSessions(data.sessions)
    setPlans(data.plans)
    setActivePlanId(data.activePlanId)
    setSelectedPlanId(null)
    setCreatingPlan(data.plans.length === 0)
  }

  return (
    <SettingsProvider>
    <div className="app">
      <header className={tab === 'log' ? 'app-header app-header-compact' : 'app-header'}>
        <h1>
          Hypertrophy Tracker {/* TEMP dev marker, delete this span + .dev-deploy-marker CSS when done testing deploys */}
          <span className="dev-deploy-marker" />
        </h1>
        <nav className="tabs">
          <button className={tab === 'home' ? 'active' : ''} onClick={() => selectTab('home')}>
            Home
          </button>
          <button className={tab === 'log' ? 'active' : ''} onClick={() => selectTab('log')}>
            Log Workout
          </button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => selectTab('history')}>
            History
          </button>
          <button className={tab === 'calendar' ? 'active' : ''} onClick={() => selectTab('calendar')}>
            Calendar
          </button>
          <button className={tab === 'plans' ? 'active' : ''} onClick={() => selectTab('plans')}>
            Plans
          </button>
          <button className={tab === 'exercises' ? 'active' : ''} onClick={() => selectTab('exercises')}>
            Exercises
          </button>
          <button className={tab === 'tools' ? 'active' : ''} onClick={() => selectTab('tools')}>
            Tools
          </button>
          <button className={tab === 'guide' ? 'active' : ''} onClick={() => selectTab('guide')}>
            Guide
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => selectTab('settings')}>
            Settings
          </button>
        </nav>
      </header>

      <nav className="tabs-mobile">
        {MOBILE_PRIMARY_TABS.map(({ key, label, icon }) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => selectTab(key)}>
            <TabIcon name={icon} />
            <span>{label}</span>
          </button>
        ))}
        <button
          className={MOBILE_MORE_TABS.some((t) => t.key === tab) || moreMenuOpen ? 'active' : ''}
          onClick={() => setMoreMenuOpen((open) => !open)}
        >
          <TabIcon name="more" />
          <span>More</span>
        </button>
      </nav>

      {moreMenuOpen && (
        <>
          <div className="more-menu-backdrop" onClick={() => setMoreMenuOpen(false)} />
          <div className="more-menu">
            {MOBILE_MORE_TABS.map(({ key, label, icon }) => (
              <button key={key} className={tab === key ? 'active' : ''} onClick={() => selectTab(key)}>
                <TabIcon name={icon} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}

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
        {/* Kept mounted (just hidden) rather than unmounted on tab switch, unlike the other tabs below -
            otherwise navigating away mid-workout (e.g. to check plates for a suggested weight) would
            reset the in-progress rest timer countdown and any not-yet-logged set inputs. */}
        <div className={tab === 'log' ? undefined : 'tab-hidden'}>
          <WorkoutLogger
            exercises={exercises}
            sessions={sessions}
            onSave={saveSession}
            plan={activePlan}
            activePlanId={activePlan?.id}
            onShowPlates={showPlatesFor}
          />
        </div>
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
              isFirstPlan={plans.length === 0}
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
              onDuplicate={() => duplicatePlan(selectedPlan.id)}
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
            sessions={sessions}
            onAdd={addExercise}
            onRemove={removeExercise}
            onUpdate={updateExercise}
          />
        )}
        {tab === 'tools' && <ToolsTab prefillWeight={toolsPrefillWeight} />}
        {tab === 'guide' && <GuideTab />}
        {tab === 'settings' && (
          <SettingsTab
            exercises={exercises}
            sessions={sessions}
            plans={plans}
            activePlanId={activePlanId}
            onImport={importData}
            onChangeUnit={changeWeightUnit}
          />
        )}
      </main>

      {undoQueue.length > 0 && (
        <Toast
          message={
            undoQueue.length > 1
              ? `${undoQueue[0].message} (+${undoQueue.length - 1} more pending)`
              : undoQueue[0].message
          }
          actionLabel="Undo"
          onAction={() => {
            undoQueue[0].undo()
            dismissUndo()
          }}
          onDismiss={dismissUndo}
        />
      )}

      <ConfirmDialog
        open={confirmState !== null}
        message={confirmState?.message ?? ''}
        onConfirm={() => {
          confirmState?.onConfirm()
          setConfirmState(null)
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
    </SettingsProvider>
  )
}
