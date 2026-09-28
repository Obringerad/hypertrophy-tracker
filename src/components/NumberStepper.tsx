interface Props {
  value: number
  step: number
  min?: number
  max?: number
  inputMode?: 'numeric' | 'decimal'
  onChange: (value: number) => void
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min?: number, max?: number): number {
  let v = value
  if (min !== undefined) v = Math.max(min, v)
  if (max !== undefined) v = Math.min(max, v)
  return v
}

/** Numeric input with +/- buttons, select-on-focus, and a mobile-friendly numeric keypad. */
export function NumberStepper({ value, step, min, max, inputMode = 'decimal', onChange }: Props) {
  return (
    <div className="number-stepper">
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(clamp(roundTo2(value - step), min, max))}
        aria-label="Decrease"
      >
        &minus;
      </button>
      <input
        type="number"
        inputMode={inputMode}
        step={step}
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
      />
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(clamp(roundTo2(value + step), min, max))}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}
