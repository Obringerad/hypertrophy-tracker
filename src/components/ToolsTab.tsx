import { useEffect, useState, type FocusEvent } from 'react'
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

// Scales every standard plate size (down to 1.25) to an integer so the DP below can index arrays by sum.
const PLATE_SCALE = 4
// Above this many scaled units the DP array would get needlessly large for a weight no one actually loads.
const MAX_SCALED_TARGET = 4000

function calculatePlates(perSide: number, plateSizes: number[]): PlateResult {
  if (perSide <= 0) return { plates: [], remainder: Math.max(0, perSide) }

  const sizes = plateSizes.map((s) => Math.round(s * PLATE_SCALE))
  const unit = Math.min(...sizes)
  const rawTarget = Math.round(perSide * PLATE_SCALE)
  const target = Math.min(Math.floor(rawTarget / unit) * unit, MAX_SCALED_TARGET)

  if (target <= 0) return { plates: [], remainder: perSide }

  // count[sum] = fewest plates that sum to exactly `sum`. A plain largest-first greedy isn't
  // always optimal for this plate set (e.g. 60 = 35+25 in 2 plates, but greedy finds 45+10+5
  // in 3), so this solves it exactly.
  const count: number[] = new Array(target + 1).fill(Infinity)
  const pick: number[] = new Array(target + 1).fill(-1)
  count[0] = 0

  for (let sum = 1; sum <= target; sum++) {
    for (const size of sizes) {
      if (size > sum) continue
      if (count[sum - size] + 1 < count[sum]) {
        count[sum] = count[sum - size] + 1
        pick[sum] = size
      }
    }
  }

  const plates: number[] = []
  let sum = target
  while (sum > 0) {
    const size = pick[sum]
    plates.push(size / PLATE_SCALE)
    sum -= size
  }
  plates.sort((a, b) => b - a)

  const remainder = Math.max(0, Math.round((perSide - target / PLATE_SCALE) * 100) / 100)
  return { plates, remainder }
}

const REP_TARGETS = [1, 3, 5, 8, 10]

/** Rounds to the nearest half-unit, matching how weights are tracked everywhere else in the app -
 * gym weights are practically always loaded in whole or half plates, not arbitrary decimals. */
function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2
}

function weightForReps(oneRepMax: number, reps: number): number {
  return roundToHalf(oneRepMax / (1 + reps / 30))
}

interface Props {
  /** Set (e.g. from a workout suggestion's "Plates for this weight" shortcut) to jump the plate calculator to that weight. */
  prefillWeight?: number | null
}

export function ToolsTab({ prefillWeight }: Props) {
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

  useEffect(() => {
    if (prefillWeight != null) setTargetWeight(String(prefillWeight))
  }, [prefillWeight])

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
    oneRmWeightNum > 0 && oneRmRepsNum > 0 ? roundToHalf(oneRmWeightNum * (1 + oneRmRepsNum / 30)) : null

  return (
    <div className="panel">
      <h2>Tools</h2>

      <div className="settings-section">
        <h3>lb ⇄ kg Converter</h3>
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
        <h3>Plate Calculator</h3>
        <div className="tool-inputs-row">
          <label>
            Target Weight ({weightUnit})
            <input type="number" inputMode="decimal" min={0} value={targetWeight} onFocus={selectAll} onChange={(e) => setTargetWeight(e.target.value)} />
          </label>
          <label>
            Bar Weight ({weightUnit})
            <input type="number" inputMode="decimal" min={0} value={barWeight} onFocus={selectAll} onChange={(e) => setBarWeight(e.target.value)} />
          </label>
        </div>

        {perSide < 0 && <p className="muted">Target weight is less than the bar itself.</p>}

        {plateResult && (
          <div className="plate-result">
            {plateResult.plates.length === 0 ? (
              <p className="muted">Bar only - no plates needed.</p>
            ) : (
              <>
                <div className="plate-barbell">
                  <div className="plate-barbell-stack">
                    {plateResult.plates
                      .slice()
                      .reverse()
                      .map((p, i) => (
                        <span key={i} className="plate-chip">
                          {p}
                        </span>
                      ))}
                  </div>
                  <div className="plate-barbell-bar" />
                  <div className="plate-barbell-stack">
                    {plateResult.plates.map((p, i) => (
                      <span key={i} className="plate-chip">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="muted plate-barbell-caption">
                  Load this on both sides - plate closest to the bar listed first.
                </p>
              </>
            )}
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
        <h3>Estimated 1-Rep Max</h3>
        <div className="tool-inputs-row">
          <label>
            Weight Lifted ({weightUnit})
            <input type="number" inputMode="decimal" min={0} value={oneRmWeight} onFocus={selectAll} onChange={(e) => setOneRmWeight(e.target.value)} />
          </label>
          <label>
            Reps Performed
            <input type="number" inputMode="numeric" min={1} value={oneRmReps} onFocus={selectAll} onChange={(e) => setOneRmReps(e.target.value)} />
          </label>
        </div>

        {estimatedOneRm !== null && (
          <>
            <p className="one-rm-result">
              {estimatedOneRm} {weightUnit} <span className="muted">estimated 1RM</span>
            </p>
            <div className="table-scroll">
              <table className="set-table one-rm-table">
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
            </div>
            <p className="muted">Estimates use the Epley formula - most accurate under ~10 reps.</p>
          </>
        )}
      </div>
    </div>
  )
}
