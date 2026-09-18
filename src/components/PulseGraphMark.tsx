interface PulseGraphMarkProps {
  className?: string;
  animated?: boolean;
}

/**
 * The app's signature mark: an ECG pulse line that resolves into
 * connected reasoning-graph nodes. Reads as "we don't just take the
 * pulse, we trace the thinking" — the core pitch of the product.
 */
export function PulseGraphMark({ className = "", animated = false }: PulseGraphMarkProps) {
  return (
    <svg
      viewBox="0 0 640 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="نبض — من التتبع الحيوي إلى خريطة التفكير"
    >
      <path
        d="M0 80 H120 L145 30 L175 130 L205 55 L230 80 H280
           C300 80 300 55 320 55 C340 55 340 105 360 105 C380 105 380 80 400 80
           H430"
        stroke="var(--color-pulse)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? "animate-draw" : undefined}
        style={animated ? ({ "--dash-length": 900 } as Record<string, number>) : undefined}
      />
      {/* graph edges */}
      <g stroke="var(--color-navy-haze)" strokeWidth="2">
        <line x1="430" y1="80" x2="480" y2="45" />
        <line x1="430" y1="80" x2="480" y2="80" />
        <line x1="430" y1="80" x2="480" y2="120" />
        <line x1="480" y1="45" x2="560" y2="30" />
        <line x1="480" y1="45" x2="560" y2="65" />
        <line x1="480" y1="120" x2="560" y2="120" />
        <line x1="480" y1="120" x2="560" y2="145" />
      </g>
      {/* graph nodes */}
      <g fill="var(--color-navy)">
        <circle cx="430" cy="80" r="6" fill="var(--color-pulse)" />
        <circle cx="480" cy="45" r="5" />
        <circle cx="480" cy="80" r="5" />
        <circle cx="480" cy="120" r="5" />
        <circle cx="560" cy="30" r="4.5" fill="var(--color-amber)" />
        <circle cx="560" cy="65" r="4.5" />
        <circle cx="560" cy="120" r="4.5" />
        <circle cx="560" cy="145" r="4.5" fill="var(--color-rose)" />
      </g>
    </svg>
  );
}
