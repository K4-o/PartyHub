import { motion } from 'framer-motion';
import { CheckCircle2, SkipForward, XCircle, Flame, ShieldAlert, Award } from 'lucide-react';
import { RoomState, TabooState, Player } from '../../../types/game';
import { usePartyStore } from '../../../store/usePartyStore';
import { haptics } from '../../../utils/haptics';

interface Props {
  room: RoomState;
  state: TabooState;
  player: Player;
}

export default function TabooController({ room, state, player }: Props) {
  const { emit } = usePartyStore();

  const isDescriber = player.deviceId === state.describerDeviceId;
  const isAuditor = player.deviceId === state.auditorDeviceId;
  const isGuessingTeam = player.team === state.activeTeam && !isDescriber;

  const handleCorrect = () => {
    haptics.medium();
    emit('taboo:action', { roomCode: room.code, action: 'CORRECT' });
  };

  const handlePass = () => {
    haptics.light();
    emit('taboo:action', { roomCode: room.code, action: 'PASS' });
  };

  const handleViolation = () => {
    haptics.heavy();
    emit('taboo:action', { roomCode: room.code, action: 'VIOLATION' });
  };

  return (
    <div className="h-dvh playful-bg flex flex-col justify-between p-4 select-none overflow-hidden">
      {/* ─── TOP STATUS ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar}</span>
          <span className="text-xs font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl">
          <span className="text-xs text-white/70 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            الوقت:
          </span>
          <span className="text-base font-black text-amber-300 font-mono">{state.timeRemaining}s</span>
        </div>
      </div>

      {/* ─── ROLE: TURN_READY ──────────────────────────────────────────────── */}
      {state.subPhase === 'TURN_READY' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto playful-card p-6">
          <span className="text-6xl block animate-bounce">
            {isDescriber ? '🗣️' : isAuditor ? '👀' : '👂'}
          </span>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isDescriber
              ? 'دورك أنت تشرح الكلمة لفريقك!'
              : isAuditor
              ? 'دورك تراقب كلام الواصف وتكبس المخالفة!'
              : 'دورك تخمّن الكلمة مع الشلة!'}
          </h2>
          <p className="text-white/70 text-xs font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isDescriber
              ? 'انتبه تنطق أي كلمة من الكلمات الممنوعة!'
              : isAuditor
              ? 'إذا قال الواصف أي كلمة ممنوعة، اضغط زر المخالفة فوراً'
              : 'ركز بصوت عالي وسرعة تخمين عالية'}
          </p>
          <div className="p-3 bg-white/10 border border-white/10 rounded-2xl text-amber-300 text-xs font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            في انتظار المضيف ليبدأ العداد على الشاشة... ⏳
          </div>
        </div>
      )}

      {/* ─── ROLE 1: DESCRIBER (DURING DESCRIBING) ─────────────────────────── */}
      {state.subPhase === 'DESCRIBING' && isDescriber && state.currentCard && (
        <div className="flex-1 flex flex-col justify-between my-2">
          {/* Target Card */}
          <div className="playful-card p-5 text-center shadow-2xl border-emerald-400/50">
            <span className="text-xs text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full font-bold mb-2 inline-block" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.currentCard.category}
            </span>
            <h1 className="text-4xl font-black text-white my-2 tracking-wide" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.currentCard.word}
            </h1>

            {/* Forbidden Words */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-black text-red-300 block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الكلمات الممنوعة (احذر تنطقها!):
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {state.currentCard.forbidden.map((word, idx) => (
                  <div
                    key={idx}
                    className="bg-red-500/15 border border-red-500/30 text-red-200 py-1.5 px-3 rounded-2xl font-bold text-sm shadow-sm"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    {word}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={handlePass}
              disabled={state.passesUsed >= 3}
              className="btn-playful-amber py-4 flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <SkipForward className="w-6 h-6" />
              <span className="text-sm font-black">تخطي (باقي {3 - state.passesUsed})</span>
            </button>

            <button
              onClick={handleCorrect}
              className="btn-playful-mint py-4 flex flex-col items-center justify-center gap-1 cursor-pointer"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              <span className="text-base font-black">صح (+1)</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── ROLE 2: AUDITOR (DURING DESCRIBING) ───────────────────────────── */}
      {state.subPhase === 'DESCRIBING' && isAuditor && state.currentCard && (
        <div className="flex-1 flex flex-col justify-between my-2">
          {/* Card to Monitor */}
          <div className="playful-card p-5 text-center shadow-2xl border-red-400/50">
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-300 font-bold mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <ShieldAlert className="w-4 h-4" />
              <span>أنت المراقب! احسب أي كلمة ممنوعة ينطقها:</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.currentCard.word}
            </h2>

            <div className="space-y-1.5">
              {state.currentCard.forbidden.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-red-500/15 border border-red-500/30 text-red-200 py-2 px-3 rounded-2xl font-bold text-sm"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>

          {/* Giant Violation Button */}
          <button
            onClick={handleViolation}
            className="btn-playful-red w-full py-5 text-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <XCircle className="w-7 h-7 stroke-[2.5]" />
            <span>مخالفة! قال الكلمة (-1)</span>
          </button>
        </div>
      )}

      {/* ─── ROLE 3: GUESSING TEAM OR SPECTATOR ────────────────────────────── */}
      {state.subPhase === 'DESCRIBING' && !isDescriber && !isAuditor && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto p-6 playful-card">
          <Flame className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isGuessingTeam
              ? 'ركّز مع خويك وخلّك سريع في التخمين! 🔥'
              : 'دور الفريق الثاني، استمتعوا وراقبوا اللعب 👀'}
          </h2>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-sm">
            <span className="text-white/70 block mb-1 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              إجابات فريقتهم الصحيحة حتى الآن:
            </span>
            <span className="text-3xl font-black text-emerald-300">
              +{state.turnStats.correctCount}
            </span>
          </div>
        </div>
      )}

      {/* ─── SUBPHASE: TURN_SUMMARY ───────────────────────────────────────── */}
      {state.subPhase === 'TURN_SUMMARY' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto playful-card p-6">
          <Award className="w-16 h-16 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            انتهت الجولة!
          </h2>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 text-sm space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-white/70">إجابات صح:</span>
              <span className="text-emerald-300">+{state.turnStats.correctCount}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-white/70">تخطي:</span>
              <span className="text-amber-300">{state.turnStats.passCount}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-white/70">مخالفات:</span>
              <span className="text-red-300">-{state.turnStats.violationCount}</span>
            </div>
          </div>
          <p className="text-xs text-white/50 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            المضيف يراجع الكلمات على الشاشة قبل بدء الجولة القادمة
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-1">
        <span className="text-[11px] text-white/40 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
          قول بس لا تقول — PartyHub 🤫
        </span>
      </div>
    </div>
  );
}
