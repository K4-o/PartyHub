import { TeamId } from '../../types/game';

interface Props {
  team: TeamId;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function TeamBadge({ team, name, size = 'md', showLabel = true }: Props) {
  const isA = team === 'A';
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const displayName = name || (isA ? 'الصقور' : 'الذئاب');

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClasses[size]} ${
        isA
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          : 'bg-violet-500/20 text-violet-400 border border-violet-500/40'
      }`}
      style={{ fontFamily: 'Cairo, sans-serif' }}
    >
      {isA ? '🦅' : '🐺'}
      {showLabel && ` ${displayName}`}
    </span>
  );
}
