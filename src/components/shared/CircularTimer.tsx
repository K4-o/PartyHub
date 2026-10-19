interface Props {
  timeRemaining: number;
  totalTime: number;
  size?: number;
  urgent?: boolean;
}

export default function CircularTimer({ timeRemaining, totalTime, size = 120, urgent = false }: Props) {
  const radius = (size - 18) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, timeRemaining / totalTime));
  const strokeDashoffset = circumference * (1 - progress);
  const isUrgent = timeRemaining <= 10 || urgent;

  return (
    <div className="relative flex items-center justify-center filter drop-shadow-lg" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="timerGradNormal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="timerGradUrgent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isUrgent ? 'url(#timerGradUrgent)' : 'url(#timerGradNormal)'}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-3xl font-black font-mono ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-white'}`}
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          {timeRemaining}
        </span>
      </div>
    </div>
  );
}
