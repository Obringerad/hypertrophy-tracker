import { useRef, useState, type ChangeEvent } from 'react'
import type { Exercise, WorkoutPlan, WorkoutSession } from '../types'
import { sessionUnit, type WeightUnit } from '../lib/units'
import { validateBackupData } from '../lib/backupValidation'
import { useSettings } from '../context/SettingsContext'
import { ConfirmDialog } from './ConfirmDialog'

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

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function toCsv(sessions: WorkoutSession[], exercises: Exercise[]): string {
  const header = ['Date', 'Exercise', 'Set', 'Weight', 'Unit', 'Reps', 'RPE', 'Recovery', 'Notes']
  const rows: string[][] = [header]
  for (const s of sessions.slice().sort((a, b) => a.date.localeCompare(b.date))) {
    const unit = sessionUnit(s)
    for (const log of s.exercises) {
      const name = exercises.find((e) => e.id === log.exerciseId)?.name ?? 'Unknown exercise'
      log.sets.forEach((set, i) => {
        rows.push([
          s.date,
          name,
          String(i + 1),
          String(set.weight),
          unit,
          String(set.reps),
          String(set.rpe),
          String(s.recovery),
          s.notes ?? '',
        ])
      })
    }
  }
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n')
}

export function SettingsTab({ exercises, sessions, plans, activePlanId, onImport, onChangeUnit }: Props) {
  const { weightUnit, setWeightUnit, textSize, setTextSize, theme, setTheme } = useSettings()
  const [pendingUnit, setPendingUnit] = useState<WeightUnit | null>(null)
  const [pendingImport, setPendingImport] = useState<Partial<BackupData> | null>(null)
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

  function handleExportCsv() {
    const csv = toCsv(sessions, exercises)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hypertrophy-data-${new Date().toISOString().slice(0, 10)}.csv`
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
        const error = validateBackupData(data)
        if (error) {
          window.alert(error)
          return
        }
        setPendingImport(data)
      } catch {
        window.alert('That file could not be read as a valid backup.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function confirmImport() {
    if (!pendingImport) return
    onImport({
      exercises: pendingImport.exercises ?? [],
      sessions: pendingImport.sessions ?? [],
      plans: pendingImport.plans ?? [],
      activePlanId: pendingImport.activePlanId ?? null,
    })
    if (pendingImport.weightUnit === 'lb' || pendingImport.weightUnit === 'kg') setWeightUnit(pendingImport.weightUnit)
    setPendingImport(null)
  }

  return (
    <div className="panel">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Weight Unit</h3>
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
                Convert All History to {pendingUnit}
              </button>
              <button type="button" className="choice-btn" onClick={() => resolveUnitChange(false)}>
                Only Use {pendingUnit} for New Workouts
              </button>
              <button type="button" className="link-btn" onClick={() => setPendingUnit(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>Text Size</h3>
        <p className="muted">Makes weights, reps, and other numbers easier to read at a glance mid-workout.</p>
        <div className="schedule-type-picker">
          <button
            type="button"
            className={textSize === 'normal' ? 'choice-btn active' : 'choice-btn'}
            onClick={() => setTextSize('normal')}
          >
            Normal
          </button>
          <button
            type="button"
            className={textSize === 'large' ? 'choice-btn active' : 'choice-btn'}
            onClick={() => setTextSize('large')}
          >
            Large
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Theme</h3>
        <p className="muted">Defaults to your device's setting. Override it to always use one or the other.</p>
        <div className="schedule-type-picker">
          <button
            type="button"
            className={theme === 'system' ? 'choice-btn active' : 'choice-btn'}
            onClick={() => setTheme('system')}
          >
            System
          </button>
          <button
            type="button"
            className={theme === 'light' ? 'choice-btn active' : 'choice-btn'}
            onClick={() => setTheme('light')}
          >
            Light
          </button>
          <button
            type="button"
            className={theme === 'dark' ? 'choice-btn active' : 'choice-btn'}
            onClick={() => setTheme('dark')}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Backup</h3>
        <p className="muted">
          Your data lives only in this browser. Export a backup periodically, or before clearing site data or
          switching devices, and you can restore it here.
        </p>
        <div className="settings-actions">
          <button type="button" className="primary" onClick={handleExport}>
            Export Backup
          </button>
          <button type="button" className="choice-btn" onClick={() => fileInputRef.current?.click()}>
            Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
        <p className="muted">Want your raw data for a spreadsheet instead?</p>
        <div className="settings-actions">
          <button type="button" className="choice-btn" onClick={handleExportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        message="Import this backup? It will replace all current data on this device."
        confirmLabel="Import"
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  )
}
