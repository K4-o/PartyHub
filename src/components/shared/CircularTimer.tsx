interface Props {
  timeRemaining: number;
  totalTime: number;
  size?: number;
  urgent?: boolean;
}

export default function CircularTimer({ timeRemaining, totalTime, size = 120, urgent = false }: Props) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, timeRemaining / totalTime));
  const strokeDashoffset = circumference * (1 - progress);
  const isUrgent = timeRemaining <= 10 || urgent;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isUrgent ? '#DC143C' : '#00FF7F'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-3xl font-black ${isUrgent ? 'text-red-400' : 'text-white'}`}
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          {timeRemaining}
        </span>
      </div>
    </div>
  );
}
