import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tv, Smartphone, Sparkles, Trophy } from 'lucide-react';
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
    {
      id: 'TABOO' as GameId,
      image: '/assets/games/taboo.png',
      fallbackEmoji: '🤫',
      name: 'قول بس لا تقول',
      badge: 'تخمين وسرعة',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'WAVELENGTH' as GameId,
      image: '/assets/games/wavelength.png',
      fallbackEmoji: '📡',
      name: 'الطول الموجي',
      badge: 'تخاطر ومؤشر',
      tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      id: 'FAMILY_FEUD' as GameId,
      image: '/assets/games/familyfeud.png',
      fallbackEmoji: '🎤',
      name: 'ستيف هارفي',
      badge: 'أجراس وتنافس',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'SPYFALL' as GameId,
      image: '/assets/games/spyfall.svg',
      fallbackEmoji: '🕵️',
      name: 'برّا السالفة',
      badge: 'غموض وتحقيق',
      tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
  ];

  return (
    <div className="min-h-screen playful-bg flex flex-col items-center justify-between p-4 md:p-8 relative overflow-hidden select-none">
      {/* Decorative Pastel Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[420px] h-[420px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-[380px] h-[380px] bg-rose-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2.4s' }} />
      </div>

      {/* ─── LOGO & BRAND HEADER ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-4 md:pt-8 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-slate-200 mb-3 shadow-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>منصة ألعاب السهرة والمجلس التفاعلية</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight flex items-center justify-center gap-3" style={{ fontFamily: 'Cairo, sans-serif' }}>
          <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">Party</span>
          <span>Hub</span>
          <span className="text-4xl md:text-6xl animate-bounce">🎉</span>
        </h1>
        <p className="text-slate-300 text-sm md:text-base mt-2 font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
          العاب جماعية باللغة العربية لشاشات التلفزيون وهواتف اللاعبين
        </p>
      </motion.div>

      {/* ─── MAIN CALL-TO-ACTION CARDS (PLAYFUL CASUAL STYLE) ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl my-6 relative z-10">
        {/* Host Main Screen Button */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleHostClick}
          className="playful-card p-6 md:p-8 text-right cursor-pointer flex flex-col justify-between border-2 border-emerald-500/30 hover:border-emerald-400/80 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-5xl group-hover:scale-110 transition-transform">📺</span>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/40 shadow-inner">
                <Tv className="w-7 h-7 text-emerald-400" />
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              شاشة العرض الرئيسية
            </h2>
            <p className="text-emerald-300 text-sm font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              للتلفزيون أو اللابتوب (الهوست)
            </p>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed" style={{ fontFamily: 'Cairo, sans-serif' }}>
              تفتح اللعبة على الشاشة الكبيرة وتعرض العدادات وباركود الدخول للمجلس.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              disabled={!isConnected}
              className="w-full py-3.5 btn-playful-mint text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <span>إنشاء غرفة جديدة الآن</span>
              <span className="text-lg">🚀</span>
            </button>
          </div>
        </motion.div>

        {/* Player Join Button */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/play')}
          className="playful-card p-6 md:p-8 text-right cursor-pointer flex flex-col justify-between border-2 border-violet-500/30 hover:border-violet-400/80 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-5xl group-hover:scale-110 transition-transform">📱</span>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500/30 to-purple-500/10 rounded-2xl flex items-center justify-center border border-violet-500/40 shadow-inner">
                <Smartphone className="w-7 h-7 text-violet-400" />
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              انضم كلاعب من جوالك
            </h2>
            <p className="text-violet-300 text-sm font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              تحكّم وتفاعل مباشر
            </p>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed" style={{ fontFamily: 'Cairo, sans-serif' }}>
              ادخل كود الغرفة الموضح على التلفزيون أو امسح الباركود وانضم لفريقك فوراً.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              className="w-full py-3.5 btn-playful-purple text-sm flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <span>دخول الغرفة واللعب</span>
              <span className="text-lg">🎮</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* ─── GAMES SHOWCASE WITH ILLUSTRATED COVERS ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-4xl relative z-10 pb-4"
      >
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 mb-3" style={{ fontFamily: 'Cairo, sans-serif' }}>
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>اختر أي لعبة لتبدأ السهرة مباشرة على الشاشة الكبيرة:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {games.map((game, i) => (
            <motion.button
              key={game.id}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleGameClick(game.id)}
              className="playful-card p-3 text-right hover:border-white/40 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group shadow-xl"
            >
              {/* Illustrated Cover Art */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-2.5 bg-slate-900 border border-white/10 flex items-center justify-center">
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to emoji if image not yet loaded
                    const target = e.target as HTMLElement;
                    target.style.display = 'none';
                  }}
                />
              </div>

              <div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block mb-1 ${game.tagColor}`} style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {game.badge}
                </span>
                <h3 className="text-sm font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {game.name}
                </h3>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ─── STATUS FOOTER ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 relative z-10 text-[11px] text-slate-500 pt-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        <span>{isConnected ? 'الخادم متصل وجاهز للاستخدام' : 'جاري الاتصال...'}</span>
      </div>
    </div>
  );
}
