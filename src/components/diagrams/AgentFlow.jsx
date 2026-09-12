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

function Arrow({ d, curved }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={colors.muted}
      strokeWidth={1.5}
      strokeOpacity={curved ? 0.5 : 0.8}
      strokeDasharray={curved ? '4 4' : undefined}
      markerEnd="url(#af-arrow)"
    />
  )
}

export default function AgentFlow() {
  const specialists = [
    { y: 47, lines: ['sql-engineer'] },
    { y: 111, lines: ['data-scientist'] },
    { y: 175, lines: ['data-platform', 'engineer'] },
    { y: 239, lines: ['ai-engineer'] },
  ]

  return (
    <svg viewBox="0 0 1010 400" className="h-auto w-full">
      <defs>
        <marker id="af-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={colors.muted} />
        </marker>
      </defs>

      <Node x={10} y={140} w={140} h={50} lines={['question']} />
      <Node x={195} y={140} w={150} h={50} lines={['analyst-lead']} tone="accent" />

      {specialists.map((s) => (
        <Node key={s.lines[0]} x={395} y={s.y} w={180} h={44} lines={s.lines} />
      ))}

      <Node x={615} y={140} w={160} h={50} lines={['qa-reviewer']} />
      <Node x={815} y={140} w={170} h={50} lines={['data-visualizer']} tone="accent" />
      <Node x={615} y={320} w={370} h={60} lines={['plain-English answer', '+ SQL + chart + caveats']} tone="accent" />

      <Arrow d="M150,165 L195,165" />
      {specialists.map((s) => (
        <Arrow key={s.lines[0]} d={`M345,165 L395,${s.y + 22}`} />
      ))}
      {specialists.map((s) => (
        <Arrow key={`${s.lines[0]}-out`} d={`M575,${s.y + 22} L615,165`} />
      ))}
      <Arrow d="M775,165 L815,165" />
      <Arrow d="M900,190 L900,320" />
      <Arrow d="M900,140 C 900,20 270,20 270,140" curved />
    </svg>
  )
}
