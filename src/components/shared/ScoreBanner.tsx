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
      <div className="flex gap-2.5 items-center">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border transition-all ${
            activeTeam === 'A'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md scale-105'
              : 'bg-white/10 border-white/15 text-white/80'
          }`}
        >
          <span className="font-black text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
            🦅 {teams.A.name || 'الصقور'}
          </span>
          <span className="text-white font-black text-base font-mono">{teams.A.score}</span>
        </div>
        <span className="text-white/40 font-black text-xs">VS</span>
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border transition-all ${
            activeTeam === 'B'
              ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-md scale-105'
              : 'bg-white/10 border-white/15 text-white/80'
          }`}
        >
          <span className="text-white font-black text-base font-mono">{teams.B.score}</span>
          <span className="font-black text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {teams.B.name || 'الذئاب'} 🐺
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 w-full items-center">
      {/* Team A */}
      <motion.div
        animate={{ scale: activeTeam === 'A' ? 1.04 : 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className={`rounded-3xl p-5 text-center shadow-xl transition-all ${
          activeTeam === 'A'
            ? 'bg-gradient-to-b from-emerald-600/40 to-teal-900/60 border-2 border-emerald-400 shadow-[0_10px_25px_rgba(16,185,129,0.25)]'
            : 'playful-card border-white/10 opacity-80'
        }`}
      >
        <div className="text-4xl mb-1">🦅</div>
        <div className="text-emerald-300 font-black text-sm drop-shadow-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {teams.A.name || 'فريق الصقور'}
        </div>
        <motion.div
          key={teams.A.score}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          className="text-5xl font-black text-white font-mono mt-1 drop-shadow-md"
        >
          {teams.A.score}
        </motion.div>
        {activeTeam === 'A' && (
          <span className="text-[10px] bg-emerald-400 text-emerald-950 font-black px-2 py-0.5 rounded-full mt-2 inline-block shadow-sm">
            الدور الحالي
          </span>
        )}
      </motion.div>

      {/* VS Badge */}
      <div className="flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-white text-amber-950 font-black text-xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
          VS
        </div>
      </div>

      {/* Team B */}
      <motion.div
        animate={{ scale: activeTeam === 'B' ? 1.04 : 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className={`rounded-3xl p-5 text-center shadow-xl transition-all ${
          activeTeam === 'B'
            ? 'bg-gradient-to-b from-purple-600/40 to-indigo-900/60 border-2 border-purple-400 shadow-[0_10px_25px_rgba(168,85,247,0.25)]'
            : 'playful-card border-white/10 opacity-80'
        }`}
      >
        <div className="text-4xl mb-1">🐺</div>
        <div className="text-purple-300 font-black text-sm drop-shadow-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {teams.B.name || 'فريق الذئاب'}
        </div>
        <motion.div
          key={teams.B.score}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          className="text-5xl font-black text-white font-mono mt-1 drop-shadow-md"
        >
          {teams.B.score}
        </motion.div>
        {activeTeam === 'B' && (
          <span className="text-[10px] bg-purple-400 text-purple-950 font-black px-2 py-0.5 rounded-full mt-2 inline-block shadow-sm">
            الدور الحالي
          </span>
        )}
      </motion.div>
    </div>
  );
}
