import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tv, Smartphone, Sparkles, Play } from 'lucide-react';
import { usePartyStore } from '../store/usePartyStore';
import { GameId } from '../types/game';

export default function LandingPage() {
  const navigate = useNavigate();
  const { createRoom, isConnected, emit } = usePartyStore();

  const handleHostClick = async () => {
    if (!isConnected) return;
    await createRoom();
    navigate('/host');
  };

  const handleGameClick = async (gameId: GameId) => {
    if (!isConnected) return;
    await createRoom();
    emit('host:select_game', { roomCode: usePartyStore.getState().roomCode, gameId });
    navigate('/host');
  };

  const games = [
    { id: 'TABOO' as GameId, emoji: '🤫', name: 'قول بس\nلا تقول', color: 'from-emerald-900/60 to-emerald-800/30 border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
    { id: 'WAVELENGTH' as GameId, emoji: '📡', name: 'الطول\nالموجي', color: 'from-cyan-900/60 to-cyan-800/30 border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]' },
    { id: 'FAMILY_FEUD' as GameId, emoji: '🎤', name: 'ستيف\nهارفي', color: 'from-amber-900/60 to-amber-800/30 border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
    { id: 'SPYFALL' as GameId, emoji: '🕵️', name: 'برّا\nالسالفة', color: 'from-red-900/60 to-red-800/30 border-red-500/40 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 relative z-10"
      >
        <div className="text-8xl mb-3">🎉</div>
        <h1 className="text-6xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
          <span className="text-emerald-400">Party</span>Hub
        </h1>
        <p className="text-slate-400 text-xl" style={{ fontFamily: 'Cairo, sans-serif' }}>
          العاب السهرة والمجلس العربي
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
        {/* Host button */}
        <motion.button
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleHostClick}
          disabled={!isConnected}
          className="game-card bg-gradient-to-br from-emerald-900/80 to-emerald-800/40 border-2 border-emerald-500/50 rounded-3xl p-8 text-right group hover:border-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
              <Tv className="w-8 h-8 text-emerald-400" />
            </div>
            <span className="text-4xl">📺</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            شاشة العرض الرئيسية
          </h2>
          <p className="text-emerald-300/70 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
            تلفزيون / لابتوب
          </p>
          <p className="text-slate-400 text-xs mt-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            أنشئ غرفة وشارك كود QR مع اللاعبين
          </p>
        </motion.button>

        {/* Play button */}
        <motion.button
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/play')}
          className="game-card bg-gradient-to-br from-violet-900/80 to-violet-800/40 border-2 border-violet-500/50 rounded-3xl p-8 text-right group hover:border-violet-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-violet-400" />
            </div>
            <span className="text-4xl">📱</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            انضم كلاعب
          </h2>
          <p className="text-violet-300/70 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
            بجوالك
          </p>
          <p className="text-slate-400 text-xs mt-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            امسح QR Code أو أدخل رمز الغرفة
          </p>
        </motion.button>
      </div>

      {/* Connection Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 flex items-center gap-2 relative z-10"
      >
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="text-slate-500 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {isConnected ? 'متصل بالخادم وجاهز' : 'جاري الاتصال...'}
        </span>
      </motion.div>

      {/* Direct Game Launch Buttons at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 w-full max-w-2xl relative z-10"
      >
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-3" style={{ fontFamily: 'Cairo, sans-serif' }}>
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>أو اضغط على أي لعبة للبدء مباشرة على شاشة العرض:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {games.map((game, i) => (
            <motion.button
              key={game.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleGameClick(game.id)}
              disabled={!isConnected}
              className={`bg-gradient-to-br ${game.color} border-2 rounded-2xl p-4 text-center cursor-pointer transition-all disabled:opacity-50 group shadow-md`}
            >
              <div className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">{game.emoji}</div>
              <div className="text-xs text-white font-bold whitespace-pre-line mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                {game.name}
              </div>
              <span className="text-[10px] text-emerald-400 opacity-80 group-hover:opacity-100 flex items-center justify-center gap-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>
                <Play className="w-2.5 h-2.5 fill-emerald-400" />
                <span>ابدأ الآن</span>
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
