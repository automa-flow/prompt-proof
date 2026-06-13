import type { ScoreZone } from '../types';

interface ScoreGaugeProps {
  score: number;
  zone: ScoreZone;
}

const ZONE_LABELS: Record<ScoreZone, string> = {
  red: 'High Risk',
  yellow: 'Proceed with Caution',
  green: 'Looking Solid',
};

const ZONE_COLORS: Record<ScoreZone, { ring: string; text: string; bg: string }> = {
  red:    { ring: 'stroke-red-500',    text: 'text-red-600',    bg: 'bg-red-50' },
  yellow: { ring: 'stroke-amber-400',  text: 'text-amber-600',  bg: 'bg-amber-50' },
  green:  { ring: 'stroke-emerald-500',text: 'text-emerald-600',bg: 'bg-emerald-50' },
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Visual circular gauge that shows the [0–100] score and zone label.
 * Pure presentational component — no logic, only display.
 */
export function ScoreGauge({ score, zone }: ScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const filled = (clampedScore / 100) * CIRCUMFERENCE;
  const dash = `${filled} ${CIRCUMFERENCE - filled}`;
  const colors = ZONE_COLORS[zone];

  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl p-6 ${colors.bg}`}>
      <svg width="140" height="140" viewBox="0 0 120 120" aria-hidden="true">
        {/* Background track */}
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={CIRCUMFERENCE / 4} /* start from top */
          className={`transition-all duration-700 ${colors.ring}`}
        />
        {/* Score text */}
        <text
          x="60"
          y="58"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="700"
          className={colors.text}
          fill="currentColor"
        >
          {clampedScore}
        </text>
        <text
          x="60"
          y="75"
          textAnchor="middle"
          fontSize="10"
          fill="#9ca3af"
        >
          / 100
        </text>
      </svg>
      <span className={`text-sm font-semibold ${colors.text}`}>
        {ZONE_LABELS[zone]}
      </span>
    </div>
  );
}
