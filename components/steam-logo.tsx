export function SteamLogo({ className = "", size = "default" }: { className?: string; size?: "small" | "default" | "large" }) {
  const sizes = {
    small: { width: 174, height: 48 },
    default: { width: 232, height: 64 },
    large: { width: 290, height: 80 },
  }

  const { width, height } = sizes[size]

  return (
    <svg
      viewBox="0 0 290 80"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible" }}
    >
      {/* X shape made of colored lines */}
      <g transform="translate(10, 10)">
        {/* Blue line (top-left to center) */}
        <line x1="0" y1="10" x2="25" y2="35" stroke="#008CB4" strokeWidth="4" strokeLinecap="round" />
        {/* Dark line (center going down-right) */}
        <line x1="15" y1="20" x2="40" y2="55" stroke="#00323C" strokeWidth="4" strokeLinecap="round" />
        {/* Green line (horizontal through center) */}
        <line x1="5" y1="35" x2="55" y2="35" stroke="#00D296" strokeWidth="4" strokeLinecap="round" />
        {/* Pink line (going up-right from center) */}
        <line x1="25" y1="35" x2="45" y2="15" stroke="#FA2864" strokeWidth="4" strokeLinecap="round" />
        {/* Yellow line (going down-left from center) */}
        <line x1="15" y1="40" x2="5" y2="58" stroke="#FAC846" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* STEAM text */}
      <text x="72" y="48" fontFamily="system-ui, -apple-system, sans-serif" fontSize="36" fontWeight="900" fill="#00323C" letterSpacing="-1">
        STEAM
      </text>
      {/* LT Klaipeda */}
      <text x="208" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="700" fill="#00323C" letterSpacing="0.5">
        LT
      </text>
      <text x="208" y="48" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="600" fill="#00323C" letterSpacing="0.5">
        Klaipėda
      </text>
    </svg>
  )
}
