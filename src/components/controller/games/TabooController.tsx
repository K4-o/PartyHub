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
    <div className="h-dvh bg-slate-950 flex flex-col justify-between p-4 select-none overflow-hidden">
      {/* ─── TOP STATUS ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar}</span>
          <span className="text-xs font-bold text-slate-300" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
            الوقت:
          </span>
          <span className="text-lg font-black text-white">{state.timeRemaining}s</span>
        </div>
      </div>

      {/* ─── ROLE: TURN_READY ──────────────────────────────────────────────── */}
      {state.subPhase === 'TURN_READY' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto">
          <span className="text-6xl block">
            {isDescriber ? '🗣️' : isAuditor ? '👀' : '👂'}
          </span>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isDescriber
              ? 'دورك أنت تشرح الكلمة لفريقك!'
              : isAuditor
              ? 'دورك تراقب كلام الواصف وتكبس المخالفة!'
              : 'دورك تخمّن الكلمة مع الشلة!'}
          </h2>
          <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isDescriber
              ? 'انتبه تنطق أي كلمة من الكلمات الممنوعة!'
              : isAuditor
              ? 'إذا قال الواصف أي كلمة ممنوعة، اضغط زر المخالفة فوراً'
              : 'ركز بصوت عالي وسرعة تخمين عالية'}
          </p>
          <div className="p-3 bg-slate-900 rounded-xl text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
            في انتظار المضيف ليبدأ العداد على الشاشة...
          </div>
        </div>
      )}

      {/* ─── ROLE 1: DESCRIBER (DURING DESCRIBING) ─────────────────────────── */}
      {state.subPhase === 'DESCRIBING' && isDescriber && state.currentCard && (
        <div className="flex-1 flex flex-col justify-between my-2">
          {/* Target Card */}
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 text-center shadow-2xl">
            <span className="text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full font-bold mb-2 inline-block" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.currentCard.category}
            </span>
            <h1 className="text-4xl font-black text-white my-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.currentCard.word}
            </h1>

            {/* Forbidden Words */}
            <div className="mt-4 space-y-1.5">
              <span className="text-xs font-bold text-red-400 block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الكلمات الممنوعة (احذر تنطقها!):
              </span>
              {state.currentCard.forbidden.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-red-950/70 border border-red-800/40 text-red-200 py-1.5 px-3 rounded-xl font-bold text-sm"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={handlePass}
              disabled={state.passesUsed >= 3}
              className="py-5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xl disabled:opacity-40 transition-transform"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <SkipForward className="w-7 h-7" />
              <span className="text-base">تخطي (باقي {3 - state.passesUsed})</span>
            </button>

            <button
              onClick={handleCorrect}
              className="py-5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xl glow-emerald transition-transform"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <CheckCircle2 className="w-7 h-7 fill-slate-950" />
              <span className="text-lg">صح (+1)</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── ROLE 2: AUDITOR (DURING DESCRIBING) ───────────────────────────── */}
      {state.subPhase === 'DESCRIBING' && isAuditor && state.currentCard && (
        <div className="flex-1 flex flex-col justify-between my-2">
          {/* Card to Monitor */}
          <div className="bg-slate-900 border-2 border-red-500/60 rounded-3xl p-5 text-center shadow-2xl">
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-bold mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
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
                  className="bg-red-950/70 border border-red-800/40 text-red-200 py-2 px-3 rounded-xl font-bold text-base"
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
            className="w-full py-6 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black rounded-3xl text-xl flex items-center justify-center gap-3 shadow-2xl glow-crimson animate-pulse mt-4 transition-transform"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <XCircle className="w-8 h-8" />
            <span>مخالفة! قال الكلمة (-1)</span>
          </button>
        </div>
      )}

      {/* ─── ROLE 3: GUESSING TEAM OR SPECTATOR ────────────────────────────── */}
      {state.subPhase === 'DESCRIBING' && !isDescriber && !isAuditor && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto p-6 bg-slate-900/60 border border-slate-800 rounded-3xl">
          <Flame className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isGuessingTeam
              ? 'ركّز مع خويك وخلّك سريع في التخمين! 🔥'
              : 'دور الفريق الثاني، استمتعوا وراقبوا اللعب 👀'}
          </h2>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-sm">
            <span className="text-slate-400 block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
              إجابات فريقتهم الصحيحة حتى الآن:
            </span>
            <span className="text-3xl font-black text-emerald-400">
              +{state.turnStats.correctCount}
            </span>
          </div>
        </div>
      )}

      {/* ─── SUBPHASE: TURN_SUMMARY ───────────────────────────────────────── */}
      {state.subPhase === 'TURN_SUMMARY' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto">
          <Award className="w-16 h-16 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            انتهت الجولة!
          </h2>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">إجابات صح:</span>
              <span className="text-emerald-400 font-bold">+{state.turnStats.correctCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">تخطي:</span>
              <span className="text-amber-400 font-bold">{state.turnStats.passCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">مخالفات:</span>
              <span className="text-red-400 font-bold">-{state.turnStats.violationCount}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500" style={{ fontFamily: 'Cairo, sans-serif' }}>
            المضيف يراجع الكلمات على الشاشة قبل بدء الجولة القادمة
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2">
        <span className="text-[10px] text-slate-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
          قول بس لا تقول — PartyHub
        </span>
      </div>
    </div>
  );
}
