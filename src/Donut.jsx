export function Donut({ primary, secondary, label = 'principal' }) {
  const total = primary + secondary
  const radius = 62
  const circumference = 2 * Math.PI * radius
  const primaryShare = total > 0 ? primary / total : 0
  const primaryArc = primaryShare * circumference
  const primaryPct = Math.round(primaryShare * 100)

  return (
    <div className="donut-wrap" aria-hidden="true">
      <svg className="donut" viewBox="0 0 168 168">
        <circle cx="84" cy="84" r={radius} fill="none" stroke="#292018" strokeWidth="18" />
        <circle
          className="donut-arc"
          cx="84"
          cy="84"
          r={radius}
          fill="none"
          stroke="#E85D04"
          strokeWidth="18"
          strokeDasharray={`${primaryArc} ${circumference - primaryArc}`}
          transform="rotate(-90 84 84)"
        />
      </svg>
      <div className="donut-center">
        <strong>{primaryPct}%</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}
