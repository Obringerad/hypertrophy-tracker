import { useRef, useState, type ChangeEvent } from 'react'
import type { Exercise, WorkoutPlan, WorkoutSession } from '../types'
import type { WeightUnit } from '../lib/units'
import { useSettings } from '../context/SettingsContext'

interface BackupData {
  version: 1
  exercises: Exercise[]
  sessions: WorkoutSession[]
  plans: WorkoutPlan[]
  activePlanId: string | null
  weightUnit: string
}

interface ImportedData {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  plans: WorkoutPlan[]
  activePlanId: string | null
}

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  plans: WorkoutPlan[]
  activePlanId: string | null
  onImport: (data: ImportedData) => void
  onChangeUnit: (fromUnit: WeightUnit, toUnit: WeightUnit, convertHistory: boolean) => void
}

const UNIT_LABEL: Record<WeightUnit, string> = { lb: 'Pounds (lb)', kg: 'Kilograms (kg)' }

export function SettingsTab({ exercises, sessions, plans, activePlanId, onImport, onChangeUnit }: Props) {
  const { weightUnit, setWeightUnit } = useSettings()
  const [pendingUnit, setPendingUnit] = useState<WeightUnit | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasLoggedWeights = sessions.some((s) => s.exercises.some((log) => log.sets.length > 0))

  function requestUnitChange(newUnit: WeightUnit) {
    if (newUnit === weightUnit) return
    if (!hasLoggedWeights) {
      // Nothing logged yet - nothing for a history/future choice to apply to.
      onChangeUnit(weightUnit, newUnit, false)
      setWeightUnit(newUnit)
      return
    }
    setPendingUnit(newUnit)
  }

  function resolveUnitChange(convertHistory: boolean) {
    if (!pendingUnit) return
    onChangeUnit(weightUnit, pendingUnit, convertHistory)
    setWeightUnit(pendingUnit)
    setPendingUnit(null)
  }

  function handleExport() {
    const data: BackupData = { version: 1, exercises, sessions, plans, activePlanId, weightUnit }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hypertrophy-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Partial<BackupData>
        if (!window.confirm('Import this backup? It will replace all current data on this device.')) return
        onImport({
          exercises: data.exercises ?? [],
          sessions: data.sessions ?? [],
          plans: data.plans ?? [],
          activePlanId: data.activePlanId ?? null,
        })
        if (data.weightUnit === 'lb' || data.weightUnit === 'kg') setWeightUnit(data.weightUnit)
      } catch {
        window.alert('That file could not be read as a valid backup.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="panel">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Weight unit</h3>
        <div className="schedule-type-picker">
          <button
            type="button"
            className={weightUnit === 'lb' ? 'choice-btn active' : 'choice-btn'}
            onClick={() => requestUnitChange('lb')}
          >
            Pounds (lb)
          </button>
          <button
            type="button"
            className={weightUnit === 'kg' ? 'choice-btn active' : 'choice-btn'}
            onClick={() => requestUnitChange('kg')}
          >
            Kilograms (kg)
          </button>
        </div>

        {pendingUnit && (
          <div className="unit-change-prompt">
            <p>
              Switch to {UNIT_LABEL[pendingUnit]}? Your logged weights are stored in whatever unit they were
              entered in, so history will keep displaying correctly either way.
            </p>
            <div className="settings-actions">
              <button type="button" className="primary" onClick={() => resolveUnitChange(true)}>
                Convert all history to {pendingUnit}
              </button>
              <button type="button" className="choice-btn" onClick={() => resolveUnitChange(false)}>
                Only use {pendingUnit} for new workouts
              </button>
              <button type="button" className="link-btn" onClick={() => setPendingUnit(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>Backup</h3>
        <p className="muted">
          Your data lives only in this browser. Export a backup periodically, or before clearing site data or
          switching devices, and you can restore it here.
        </p>
        <div className="settings-actions">
          <button type="button" className="primary" onClick={handleExport}>
            Export backup
          </button>
          <button type="button" className="choice-btn" onClick={() => fileInputRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
