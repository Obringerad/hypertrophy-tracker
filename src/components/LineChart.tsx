import { useState, type PointerEvent } from 'react'

interface Point {
  label: string
  value: number
}

interface Props {
  points: Point[]
  valueSuffix?: string
}

const WIDTH = 600
const HEIGHT = 220
const PAD_X = 16
const PAD_TOP = 16
const PAD_BOTTOM = 16
const GRID_STEPS = 3

export function LineChart({ points, valueSuffix = '' }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (points.length === 0) return null

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const stepX = points.length > 1 ? (WIDTH - PAD_X * 2) / (points.length - 1) : 0

  function coords(i: number): [number, number] {
    const x = PAD_X + stepX * i
    const y = PAD_TOP + plotHeight - ((points[i].value - min) / range) * plotHeight
    return [x, y]
  }

  const pathD = points
    .map((_, i) => coords(i))
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')

  function handlePointer(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
    let nearest = 0
    let nearestDist = Infinity
    points.forEach((_, i) => {
      const [x] = coords(i)
      const dist = Math.abs(x - relX)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  const lastIndex = points.length - 1
  const gridValues =
    GRID_STEPS > 1
      ? Array.from({ length: GRID_STEPS }, (_, i) => min + (range * i) / (GRID_STEPS - 1))
      : [min]

  const [hoverX, hoverY] = hoverIndex !== null ? coords(hoverIndex) : [0, 0]
  const [endX, endY] = coords(lastIndex)

  return (
    <div className="line-chart">
      <div className="line-chart-wrap">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="line-chart-svg"
          onPointerDown={handlePointer}
          onPointerMove={handlePointer}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {gridValues.map((v, i) => {
            const y = PAD_TOP + plotHeight - ((v - min) / range) * plotHeight
            return (
              <g key={i}>
                <line x1={PAD_X} y1={y} x2={WIDTH - PAD_X} y2={y} className="line-chart-grid" />
                <text x={PAD_X} y={y - 4} className="line-chart-value-label">
                  {Math.round(v)}
                  {valueSuffix}
                </text>
              </g>
            )
          })}

          {hoverIndex !== null && (
            <line x1={hoverX} y1={PAD_TOP} x2={hoverX} y2={HEIGHT - PAD_BOTTOM} className="line-chart-crosshair" />
          )}

          <path d={pathD} className="line-chart-path" fill="none" />

          {points.map((_, i) => {
            const [x, y] = coords(i)
            return <circle key={i} cx={x} cy={y} r={i === (hoverIndex ?? -1) ? 5.5 : 3.5} className="line-chart-dot" />
          })}
        </svg>

        {hoverIndex === null && (
          <div
            className="line-chart-end-label"
            style={{ left: `${(endX / WIDTH) * 100}%`, top: `${(endY / HEIGHT) * 100}%` }}
          >
            {points[lastIndex].value}
            {valueSuffix}
          </div>
        )}

        {hoverIndex !== null && (
          <div
            className="line-chart-tooltip"
            style={{ left: `${(hoverX / WIDTH) * 100}%`, top: `${(hoverY / HEIGHT) * 100}%` }}
          >
            <span className="line-chart-tooltip-value">
              {points[hoverIndex].value}
              {valueSuffix}
            </span>
            <span className="line-chart-tooltip-label">{points[hoverIndex].label}</span>
          </div>
        )}
      </div>
      <div className="line-chart-x-labels">
        <span>{points[0].label}</span>
        {points.length > 1 && <span>{points[lastIndex].label}</span>}
      </div>
    </div>
  )
}
