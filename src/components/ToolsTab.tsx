import { useState } from 'react'
import { convertWeight } from '../lib/units'

function formatResult(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : ''
}

export function ToolsTab() {
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

  return (
    <div className="panel">
      <h2>Tools</h2>

      <div className="settings-section">
        <h3>lb ⇄ kg converter</h3>
        <div className="unit-converter">
          <label>
            Pounds
            <input
              type="number"
              inputMode="decimal"
              value={lb}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleLbChange(e.target.value)}
            />
          </label>
          <span className="unit-converter-sep">=</span>
          <label>
            Kilograms
            <input
              type="number"
              inputMode="decimal"
              value={kg}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleKgChange(e.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
