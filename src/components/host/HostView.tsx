import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  QrCode,
  Users,
  RotateCcw,
  Play,
  Monitor,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePartyStore } from '../../store/usePartyStore';
import HostLobby from './HostLobby';
import TabooHost from './games/TabooHost';
import WavelengthHost from './games/WavelengthHost';
import FamilyFeudHost from './games/FamilyFeudHost';
import SpyfallHost from './games/SpyfallHost';
import ScoreBanner from '../shared/ScoreBanner';

const GAME_NAMES: Record<string, { title: string; emoji: string; rules: string[] }> = {
  TABOO: {
    title: 'قول بس لا تقول',
    emoji: '🤫',
    rules: [
      'الواصف يشرح الكلمة لفريقه بدون ما ينطق أي كلمة من الكلمات الـ 5 الممنوعة!',
      'ممنوع الترجمة للإنجليزية أو الإشارة باليدين.',
      'لكل جولة 60 ثانية، ومسموح بـ 3 تخطيات كحد أقصى.',
      'الصح = +1 نقطة، المخالفة = -1 نقطة للفريق!',
    ],
  },
  WAVELENGTH: {
    title: 'الطول الموجي',
    emoji: '📡',
    rules: [
      'البيشيك يشوف الهدف السري ويعطي تلميح واحد يناسب درجته بين القطبين.',
      'أعضاء الفريق يتناقشون ويحركون المؤشر على الشاشة.',
      'الفريق المنافس يحاول يسرق نقطة بتخمين هل الهدف يمين أو يسار المؤشر!',
      'كل ما كان المؤشر أقرب للهدف، زادت النقاط (4، 3، أو 2 نقطة).',
    ],
  },
  FAMILY_FEUD: {
    title: 'ستيف هارفي (حرب العائلات)',
    emoji: '🎤',
    rules: [
      'أول مرحلة: سباق الأجراس! أسرع لاعب يضغط الجرس ياخذ دور فريقه.',
      'الفريق المسيطر يحاول يجاوب كل الإجابات الموجودة على اللوحة.',
      '3 أخطاء (XXX) تعطي الفريق الثاني فرصة لسرقة كل نقاط الجولة!',
    ],
  },
  SPYFALL: {
    title: 'برّا السالفة',
    emoji: '🕵️',
    rules: [
      'الجميع يعرف المكان السري ودوره فيه، ما عدا الجاسوس (برّا السالفة)!',
      'اسألوا بعض أسئلة ذكية تكشف الجاسوس بدون ما توضحون له المكان.',
      'في نهاية الوقت، صوّتوا على مين هو الجاسوس.',
      'إذا كشفتوا الجاسوس، عنده فرصة أخيرة لتخمين المكان والفوز!',
    ],
  },
};

export default function HostView() {
  const navigate = useNavigate();
  const {
    room,
    roomCode,
    lanIp,
    baseUrl,
    emit,
    isMuted,
    setMuted,
    showViolationFlash,
    showStrikeOverlay,
    showQRModal,
    setShowQRModal,
    gameOverData,
    clearGameOver,
    createRoom,
    isConnected,
  } = usePartyStore();

  const [activeTab, setActiveTab] = useState<'game' | 'players'>('game');

  // Auto-create room if navigating directly to /host
  useEffect(() => {
    if (isConnected && !room) {
      createRoom();
    }
  }, [isConnected, room, createRoom]);

  // Trigger confetti on game over
  useEffect(() => {
    if (gameOverData || room?.phase === 'GAME_OVER') {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
      });
    }
  }, [gameOverData, room?.phase]);

  // If room is initializing
  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4 animate-bounce">📺</div>
        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
          جاري تجهيز الغرفة...
        </h2>
        <p className="text-slate-400 mb-6 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
          ثواني وندخلك شاشة العرض
        </p>
        <button
          onClick={() => createRoom()}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          إنشاء غرفة الآن
        </button>
      </div>
    );
  }

  const qrUrl = `${baseUrl || `http://${lanIp}:5173`}/play?room=${room.code}`;
  const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
  const selectedGameInfo = room.selectedGame ? GAME_NAMES[room.selectedGame] : null;

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col relative select-none ${showViolationFlash ? 'animate-flash-red' : ''}`}>
      {/* ─── STRIKE OVERLAY (FAMILY FEUD) ─────────────────────────────────── */}
      <AnimatePresence>
        {showStrikeOverlay > 0 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="strike-overlay bg-red-950/80 backdrop-blur-md"
          >
            <div className="flex gap-6 items-center">
              {Array.from({ length: showStrikeOverlay }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
                  className="text-8xl md:text-9xl font-black text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.9)]"
                >
                  X
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TOP UTILITY BAR ──────────────────────────────────────────────── */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          {/* Room Code Badge */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl px-4 py-1.5">
            <span className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
              كود الغرفة:
            </span>
            <span
              className="text-xl font-black text-emerald-400 tracking-wider"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              {room.code}
            </span>
          </div>

          {/* Quick QR toggle */}
          <button
            onClick={() => setShowQRModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
            style={{ fontFamily: 'Cairo, sans-serif' }}
            title="عرض كود QR"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">كود QR</span>
          </button>

          {/* Connected players pill */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-300 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {connectedPlayers.length}
            </span>
            <div className="flex -space-x-1 space-x-reverse mr-1">
              {connectedPlayers.slice(0, 4).map((p) => (
                <span key={p.deviceId} className="text-sm">
                  {p.avatar}
                </span>
              ))}
            </div>
          </div>

          {/* Single screen mode badge */}
          {room.settings.singleScreenMode && (
            <span
              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-full text-xs font-bold"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>تحكم مباشر</span>
            </span>
          )}
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-3">
          {/* Mute button */}
          <button
            onClick={() => setMuted(!isMuted)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Change Game */}
          {room.phase !== 'LOBBY' && (
            <button
              onClick={() => emit('host:switch_game', { roomCode: room.code })}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تغيير اللعبة</span>
            </button>
          )}

          {/* Reset to Lobby */}
          {room.phase !== 'LOBBY' && (
            <button
              onClick={() => emit('host:reset_to_lobby', { roomCode: room.code })}
              className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 rounded-xl text-xs font-bold transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              إنهاء السهرة
            </button>
          )}
        </div>
      </header>

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {room.phase === 'LOBBY' && <HostLobby room={room} />}

        {room.phase === 'RULES_PREVIEW' && selectedGameInfo && (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900/90 border border-slate-800 max-w-2xl w-full rounded-3xl p-8 text-center"
            >
              <div className="text-7xl mb-4">{selectedGameInfo.emoji}</div>
              <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                {selectedGameInfo.title}
              </h2>
              <div className="my-6 space-y-3 text-right bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80">
                <h4 className="text-emerald-400 font-bold mb-3 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  قواعد اللعبة:
                </h4>
                {selectedGameInfo.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                    <span className="text-emerald-400 font-bold">#{idx + 1}</span>
                    <span style={{ fontFamily: 'Cairo, sans-serif' }}>{rule}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <button
                  onClick={() => emit('host:switch_game', { roomCode: room.code })}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-colors"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  رجوع
                </button>
                <button
                  onClick={() => emit('host:start_game', { roomCode: room.code })}
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-colors flex items-center gap-2 glow-emerald"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>بدء اللعبة الآن!</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {(room.phase === 'IN_GAME' || room.phase === 'ROUND_SUMMARY') && room.gameState && (
          <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
            {room.gameState.gameId === 'TABOO' && <TabooHost room={room} state={room.gameState} />}
            {room.gameState.gameId === 'WAVELENGTH' && <WavelengthHost room={room} state={room.gameState} />}
            {room.gameState.gameId === 'FAMILY_FEUD' && <FamilyFeudHost room={room} state={room.gameState} />}
            {room.gameState.gameId === 'SPYFALL' && <SpyfallHost room={room} state={room.gameState} />}
          </div>
        )}

        {room.phase === 'GAME_OVER' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900/90 border border-slate-800 max-w-xl w-full rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="text-8xl mb-4">🏆</div>
              <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                نهاية اللعبة!
              </h2>
              <div className="my-6">
                <ScoreBanner teams={room.teams} />
              </div>
              <button
                onClick={() => {
                  clearGameOver();
                  emit('host:reset_to_lobby', { roomCode: room.code });
                }}
                className="mt-6 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-colors glow-emerald"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                العودة للوبي واختيار لعبة ثانية
              </button>
            </motion.div>
          </div>
        )}
      </main>

      {/* ─── QUICK QR CODE MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center max-w-sm w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                انضمام سريع
              </h3>
              <p className="text-slate-400 text-sm mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
                كود الغرفة: <span className="text-emerald-400 font-bold">{room.code}</span>
              </p>
              <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
                <QRCodeSVG value={qrUrl} size={220} />
              </div>
              <p className="text-slate-500 text-xs mt-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
                امسح الكود بكاميرا الجوال للانضمام فوراً
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
