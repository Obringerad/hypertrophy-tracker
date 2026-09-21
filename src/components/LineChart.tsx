interface Point {
  label: string
  value: number
}

interface Props {
  points: Point[]
}

const WIDTH = 600
const HEIGHT = 160
const PAD_X = 8
const PAD_Y = 18

export function LineChart({ points }: Props) {
  if (points.length === 0) return null

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = points.length > 1 ? (WIDTH - PAD_X * 2) / (points.length - 1) : 0

  function coords(i: number): [number, number] {
    const x = PAD_X + stepX * i
    const y = HEIGHT - PAD_Y - ((points[i].value - min) / range) * (HEIGHT - PAD_Y * 2)
    return [x, y]
  }

  const pathD = points
    .map((_, i) => coords(i))
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')

  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="line-chart-svg">
        <line
          x1={PAD_X}
          y1={HEIGHT - PAD_Y}
          x2={WIDTH - PAD_X}
          y2={HEIGHT - PAD_Y}
          className="line-chart-axis"
        />
        <path d={pathD} className="line-chart-path" fill="none" />
        {points.map((_, i) => {
          const [x, y] = coords(i)
          return <circle key={i} cx={x} cy={y} r={3.5} className="line-chart-dot" />
        })}
        <text x={PAD_X} y={12} className="line-chart-value-label">
          {max}
        </text>
        {min !== max && (
          <text x={PAD_X} y={HEIGHT - PAD_Y - 4} className="line-chart-value-label">
            {min}
          </text>
        )}
      </svg>
      <div className="line-chart-x-labels">
        <span>{points[0].label}</span>
        {points.length > 1 && <span>{points[points.length - 1].label}</span>}
      </div>
    </div>
  )
}
