export function TipaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tipa"
    >
      <circle cx="50" cy="50" r="48" fill="#FFC61A" />

      {/* Notepad */}
      <path
        d="M28 34 a6 6 0 0 1 6 -6 h32 a6 6 0 0 1 6 6 v32 l-10 10 h-28 a6 6 0 0 1 -6 -6 z"
        fill="#1A1A1A"
      />
      {/* Page-curl highlight, bottom-right corner */}
      <path d="M62 66 v10 l10 -10 z" fill="#FFC61A" opacity="0.55" />

      {/* Spiral rings */}
      <g stroke="#1A1A1A" strokeWidth="3.2" fill="none" strokeLinecap="round">
        <path d="M38 30 v-8 a3 3 0 0 1 6 0 v8" />
        <path d="M50 30 v-8 a3 3 0 0 1 6 0 v8" />
        <path d="M62 30 v-8 a3 3 0 0 1 6 0 v8" />
      </g>

      {/* "टि | PA" wordmark */}
      <text
        x="45.5"
        y="59"
        textAnchor="end"
        fontFamily="'Noto Sans Devanagari', 'Noto Sans', sans-serif"
        fontWeight="700"
        fontSize="19"
        fill="#FFC61A"
      >
        टि
      </text>
      <rect x="47.2" y="45" width="1.6" height="14" fill="#FFC61A" opacity="0.7" />
      <text
        x="51"
        y="58"
        textAnchor="start"
        fontFamily="'Noto Sans', sans-serif"
        fontWeight="800"
        fontSize="15"
        letterSpacing="0.5"
        fill="#FFC61A"
      >
        PA
      </text>
    </svg>
  );
}
