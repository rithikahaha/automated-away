import { colors } from './theme'

const mono = { fontFamily: '"JetBrains Mono", ui-monospace, monospace' }

function Node({ x, y, w, h, lines, tone = 'default' }) {
  const stroke = tone === 'accent' ? colors.accent : colors.border
  const fill = tone === 'accent' ? 'rgba(167,139,250,0.08)' : colors.surface
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle" fill={colors.text} fontSize={12} style={mono}>
        {lines.map((line, i) => (
          <tspan key={line} x={x + w / 2} dy={i === 0 ? (lines.length > 1 ? -7 : 0) : 14}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function Arrow({ d }) {
  return <path d={d} fill="none" stroke={colors.muted} strokeWidth={1.5} strokeOpacity={0.8} markerEnd="url(#sc-arrow)" />
}

export default function SupplyChainFlow() {
  return (
    <svg viewBox="0 0 1080 300" className="h-auto w-full">
      <defs>
        <marker id="sc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={colors.muted} />
        </marker>
      </defs>

      <Node x={10} y={135} w={180} h={60} lines={['180K+ orders', '(raw)']} />
      <Node x={230} y={135} w={180} h={60} lines={['SQL audit', '(SQLite)']} />
      <Node x={450} y={60} w={180} h={55} lines={['PySpark', '(at scale)']} />
      <Node x={450} y={195} w={180} h={55} lines={['Snowflake', '(validation)']} />
      <Node x={670} y={135} w={180} h={60} lines={['A/B test', '(p < 0.001)']} tone="accent" />
      <Node x={890} y={135} w={180} h={60} lines={['Tableau', 'dashboard']} tone="accent" />

      <Arrow d="M190,165 L230,165" />
      <Arrow d="M410,165 L450,87" />
      <Arrow d="M410,165 L450,222" />
      <Arrow d="M630,87 L670,165" />
      <Arrow d="M630,222 L670,165" />
      <Arrow d="M850,165 L890,165" />
    </svg>
  )
}
