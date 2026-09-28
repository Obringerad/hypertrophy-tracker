import { useState, type FocusEvent } from 'react'
import { convertWeight, type WeightUnit } from '../lib/units'
import { useSettings } from '../context/SettingsContext'

function formatResult(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : ''
}

function selectAll(e: FocusEvent<HTMLInputElement>) {
  e.target.select()
}

const DEFAULT_BAR_WEIGHT: Record<WeightUnit, number> = { lb: 45, kg: 20 }
const PLATE_SIZES: Record<WeightUnit, number[]> = {
  lb: [45, 35, 25, 10, 5, 2.5],
  kg: [20, 15, 10, 5, 2.5, 1.25],
}

interface PlateResult {
  plates: number[]
  remainder: number
}

function calculatePlates(perSide: number, plateSizes: number[]): PlateResult {
  let remaining = perSide
  const plates: number[] = []
  for (const size of plateSizes) {
    while (remaining + 1e-9 >= size) {
      plates.push(size)
      remaining = Math.round((remaining - size) * 100) / 100
    }
  }
  return { plates, remainder: Math.max(0, remaining) }
}

const REP_TARGETS = [1, 3, 5, 8, 10]

function weightForReps(oneRepMax: number, reps: number): number {
  return Math.round((oneRepMax / (1 + reps / 30)) * 10) / 10
}

export function ToolsTab() {
  const { weightUnit } = useSettings()

  const [lb, setLb] = useState('135')
  const [kg, setKg] = useState(() => formatResult(convertWeight(135, 'lb', 'kg')))

  function handleLbChange(value: string) {
    setLb(value)
    const n = Number(value)
    setKg(value.trim() === '' || Number.isNaN(n) ? '' : formatResult(convertWeight(n, 'lb', 'kg')))
  }

  function handleKgChange(value: string) {
    setKg(value)
    const n = Number(value)
    setLb(value.trim() === '' || Number.isNaN(n) ? '' : formatResult(convertWeight(n, 'kg', 'lb')))
  }

  const [targetWeight, setTargetWeight] = useState('225')
  const [barWeight, setBarWeight] = useState(() => String(DEFAULT_BAR_WEIGHT[weightUnit]))

  const targetWeightNum = Number(targetWeight)
  const barWeightNum = Number(barWeight)
  const perSide =
    Number.isFinite(targetWeightNum) && Number.isFinite(barWeightNum)
      ? Math.round(((targetWeightNum - barWeightNum) / 2) * 100) / 100
      : NaN
  const plateResult = Number.isFinite(perSide) && perSide >= 0 ? calculatePlates(perSide, PLATE_SIZES[weightUnit]) : null
  const achievedTotal = plateResult ? Math.round((barWeightNum + plateResult.plates.reduce((a, b) => a + b, 0) * 2) * 100) / 100 : null

  const [oneRmWeight, setOneRmWeight] = useState('185')
  const [oneRmReps, setOneRmReps] = useState('5')

  const oneRmWeightNum = Number(oneRmWeight)
  const oneRmRepsNum = Number(oneRmReps)
  const estimatedOneRm =
    oneRmWeightNum > 0 && oneRmRepsNum > 0 ? Math.round(oneRmWeightNum * (1 + oneRmRepsNum / 30) * 10) / 10 : null

  return (
    <div className="panel">
      <h2>Tools</h2>

      <div className="settings-section">
        <h3>lb ⇄ kg converter</h3>
        <div className="tool-inputs-row">
          <label>
            Pounds
            <input type="number" inputMode="decimal" value={lb} onFocus={selectAll} onChange={(e) => handleLbChange(e.target.value)} />
          </label>
          <span className="tool-inputs-sep">=</span>

          <label>
            Kilograms
            <input type="number" inputMode="decimal" value={kg} onFocus={selectAll} onChange={(e) => handleKgChange(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Plate calculator</h3>
        <div className="tool-inputs-row">
          <label>
            Target weight ({weightUnit})
            <input type="number" inputMode="decimal" value={targetWeight} onFocus={selectAll} onChange={(e) => setTargetWeight(e.target.value)} />
          </label>
          <label>
            Bar weight ({weightUnit})
            <input type="number" inputMode="decimal" value={barWeight} onFocus={selectAll} onChange={(e) => setBarWeight(e.target.value)} />
          </label>
        </div>

        {perSide < 0 && <p className="muted">Target weight is less than the bar itself.</p>}

        {plateResult && (
          <div className="plate-result">
            <p className="muted">Plates per side:</p>
            <div className="plate-chip-row">
              {plateResult.plates.length === 0 ? (
                <span className="muted">Bar only</span>
              ) : (
                plateResult.plates.map((p, i) => (
                  <span key={i} className="plate-chip">
                    {p}
                  </span>
                ))
              )}
            </div>
            {plateResult.remainder > 0 && (
              <p className="muted">
                Closest match - {plateResult.remainder} {weightUnit} per side can't be made with these plates.
              </p>
            )}
            <p className="meta-text">
              Total: {achievedTotal} {weightUnit}
            </p>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>Estimated 1-rep max</h3>
        <div className="tool-inputs-row">
          <label>
            Weight lifted ({weightUnit})
            <input type="number" inputMode="decimal" value={oneRmWeight} onFocus={selectAll} onChange={(e) => setOneRmWeight(e.target.value)} />
          </label>
          <label>
            Reps performed
            <input type="number" inputMode="numeric" value={oneRmReps} onFocus={selectAll} onChange={(e) => setOneRmReps(e.target.value)} />
          </label>
        </div>

        {estimatedOneRm !== null && (
          <>
            <p className="one-rm-result">
              {estimatedOneRm} {weightUnit} <span className="muted">estimated 1RM</span>
            </p>
            <table className="set-table">
              <thead>
                <tr>
                  <th>Reps</th>
                  {REP_TARGETS.map((r) => (
                    <th key={r}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{weightUnit}</td>
                  {REP_TARGETS.map((r) => (
                    <td key={r}>{weightForReps(estimatedOneRm, r)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p className="muted">Estimates use the Epley formula - most accurate under ~10 reps.</p>
          </>
        )}
      </div>
    </div>
  )
}
