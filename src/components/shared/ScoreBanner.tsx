import { motion } from 'framer-motion';
import { TeamState } from '../../types/game';

interface Props {
  teams: { A: TeamState; B: TeamState };
  activeTeam?: 'A' | 'B';
  compact?: boolean;
}

export default function ScoreBanner({ teams, activeTeam, compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex gap-3 items-center">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            activeTeam === 'A' ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-800/50'
          }`}
        >
          <span className="text-emerald-400 font-bold text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
            الصقور
          </span>
          <span className="text-white font-black text-lg">{teams.A.score}</span>
        </div>
        <span className="text-slate-600">vs</span>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            activeTeam === 'B' ? 'bg-violet-500/20 border border-violet-500/50' : 'bg-slate-800/50'
          }`}
        >
          <span className="text-white font-black text-lg">{teams.B.score}</span>
          <span className="text-violet-400 font-bold text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
            الذئاب
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      {/* Team A */}
      <motion.div
        animate={{ scale: activeTeam === 'A' ? 1.05 : 1 }}
        className={`rounded-2xl p-4 text-center ${
          activeTeam === 'A'
            ? 'bg-gradient-to-br from-emerald-900/80 to-emerald-800/50 border-2 border-emerald-400/60 glow-emerald'
            : 'bg-slate-900/60 border border-slate-700/50'
        }`}
      >
        <div className="text-3xl mb-1">🦅</div>
        <div className="text-emerald-400 font-bold text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {teams.A.name}
        </div>
        <motion.div
          key={teams.A.score}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          className="text-5xl font-black text-white"
        >
          {teams.A.score}
        </motion.div>
      </motion.div>

      {/* VS */}
      <div className="flex items-center justify-center">
        <span className="text-slate-500 text-3xl font-black">VS</span>
      </div>

      {/* Team B */}
      <motion.div
        animate={{ scale: activeTeam === 'B' ? 1.05 : 1 }}
        className={`rounded-2xl p-4 text-center ${
          activeTeam === 'B'
            ? 'bg-gradient-to-br from-violet-900/80 to-violet-800/50 border-2 border-violet-400/60 glow-violet'
            : 'bg-slate-900/60 border border-slate-700/50'
        }`}
      >
        <div className="text-3xl mb-1">🐺</div>
        <div className="text-violet-400 font-bold text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {teams.B.name}
        </div>
        <motion.div
          key={teams.B.score}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          className="text-5xl font-black text-white"
        >
          {teams.B.score}
        </motion.div>
      </motion.div>
    </div>
  );
}
