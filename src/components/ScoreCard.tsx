interface ScoreCardProps {
  score: number;
  maxScore?: number;
  size?: 'default' | 'large';
  label?: string;
}

function getScoreColor(score: number): string {
  if (score < 40) return 'text-ng-red';
  if (score < 60) return 'text-ng-orange';
  if (score < 80) return 'text-ng-black';
  return 'text-ng-green';
}

function getRingColor(score: number): string {
  if (score < 40) return 'stroke-ng-red';
  if (score < 60) return 'stroke-ng-orange';
  if (score < 80) return 'stroke-ng-black';
  return 'stroke-ng-green';
}

export function ScoreCard({ score, maxScore = 100, size = 'default', label = 'Quality Score' }: ScoreCardProps) {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isLarge = size === 'large';

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${isLarge ? 'h-48 w-48' : 'h-36 w-36'}`}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-ng-border"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${getRingColor(score)} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold tabular-nums ${getScoreColor(score)} ${isLarge ? 'text-5xl' : 'text-4xl'}`}>
            {score}
          </span>
          <span className={`text-ng-muted ${isLarge ? 'text-base' : 'text-sm'}`}>/ {maxScore}</span>
        </div>
      </div>
      <p className={`mt-2 font-semibold text-ng-muted ${isLarge ? 'text-base' : 'text-sm'}`}>{label}</p>
    </div>
  );
}

/** Text-only score display for Quality Gate */
export function TextScoreDisplay({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const color = score < 40 ? 'text-ng-red' : score < 60 ? 'text-ng-orange' : 'text-ng-black';

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-ng-muted">Quality Score</p>
      <p className={`mt-2 text-6xl font-bold tabular-nums tracking-tight ${color}`}>
        {score}
        <span className="text-2xl font-semibold text-ng-muted">/{maxScore}</span>
      </p>
    </div>
  );
}
