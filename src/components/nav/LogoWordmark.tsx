interface LogoWordmarkProps {
  size?: number
  color?: string
}

export function LogoWordmark({ size = 14, color = 'var(--text-1)' }: LogoWordmarkProps) {
  const capH = size * 1.08
  const sw = size * 0.165
  const rW = size * 0.72

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.05,
        color,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {/* Custom R — open aperture at top-back (top-left of bowl) */}
      <svg
        width={rW}
        height={capH}
        viewBox="0 0 10 14"
        fill="none"
        aria-hidden="true"
        style={{ display: 'block', flexShrink: 0 }}
      >
        {/* Stem */}
        <line
          x1={sw / 2}
          y1="0"
          x2={sw / 2}
          y2="14"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="square"
        />
        {/*
          Bowl — open at top-back:
          Starts from mid-stem (y≈8), curves right to (9,4), then back
          toward the stem top but stops at y≈2 — leaving a gap
          from y=0 to y=2 on the left side (the open aperture).
        */}
        <path
          d={`M ${sw},8 C ${sw},8 9,8 9,4 C 9,0.5 6,0.5 ${sw},2`}
          stroke="currentColor"
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Leg — diagonal from bowl-stem junction to bottom-right */}
        <line
          x1={sw}
          y1="8"
          x2="9.5"
          y2="14"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </svg>

      {/* Rest of wordmark — Inter 700 */}
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: size,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1,
        }}
      >
        OOBIRD
      </span>
    </span>
  )
}
