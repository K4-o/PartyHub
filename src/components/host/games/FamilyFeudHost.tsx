import { motion } from 'framer-motion';
import { Bell, AlertOctagon, RotateCcw, ArrowRight, ShieldAlert, Award } from 'lucide-react';
import { RoomState, FamilyFeudState } from '../../../types/game';
import { usePartyStore } from '../../../store/usePartyStore';
import ScoreBanner from '../../shared/ScoreBanner';
import HostOverrideDrawer from '../../shared/HostOverrideDrawer';

interface Props {
  room: RoomState;
  state: FamilyFeudState;
}

export default function FamilyFeudHost({ room, state }: Props) {
  const { emit } = usePartyStore();

  const controllingTeamState = state.controllingTeam ? room.teams[state.controllingTeam] : null;
  const opposingTeamId = state.controllingTeam === 'A' ? 'B' : 'A';
  const opposingTeamState = room.teams[opposingTeamId];

  const handleAssignControl = (team: 'A' | 'B') => {
    emit('feud:assign_control', { roomCode: room.code, team });
  };

  const handleRevealAnswer = (answerIndex: number) => {
    emit('feud:reveal_answer', { roomCode: room.code, answerIndex });
  };

  const handleStrike = () => {
    emit('feud:strike', { roomCode: room.code });
  };

  const handleStealAnswer = (answerIndex: number) => {
    emit('feud:steal_answer', { roomCode: room.code, answerIndex });
  };

  const handleStealMiss = () => {
    emit('feud:steal_miss', { roomCode: room.code });
  };

  const handleResetBuzzer = () => {
    emit('feud:reset_buzzer', { roomCode: room.code });
  };

  const handleNextRound = () => {
    emit('feud:next_round', { roomCode: room.code });
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full pb-20">
      {/* ─── TOP: SCORE BANNER ────────────────────────────────────────────── */}
      <div className="mb-4">
        <ScoreBanner teams={room.teams} activeTeam={state.controllingTeam || undefined} />
      </div>

      {/* ─── POT & ROUND HEADER ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-3 mb-4">
        <div className="text-right">
          <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>
            الجولة {state.roundNumber} من {state.maxRounds}
          </span>
          <span className="text-sm font-bold text-amber-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
            المضاعف: X{state.multiplier}
          </span>
        </div>

        {/* Center: Current Pot */}
        <div className="text-center">
          <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>
            بنك النقاط الحالي
          </span>
          <span className="text-3xl font-black text-amber-300 tracking-wider">
            {state.roundPot} نقطة
          </span>
        </div>

        {/* Strikes Tracker */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xl ${
                s <= state.strikes
                  ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                  : 'bg-slate-950 border-slate-800 text-slate-700'
              }`}
            >
              X
            </div>
          ))}
        </div>
      </div>

      {/* ─── SURVEY QUESTION ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-blue-950/80 border-2 border-blue-600/40 rounded-3xl p-6 text-center mb-6 shadow-2xl">
        <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
          سؤال الجمهور (100 شخص)
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {state.question}
        </h2>
      </div>

      {/* ─── SUBPHASE: FACE-OFF BUZZER RACE ───────────────────────────────── */}
      {state.subPhase === 'FACE_OFF' && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center my-4 shadow-xl"
        >
          {state.buzzerLockedBy ? (
            <div>
              <div className="text-6xl mb-3 animate-bounce">🔔</div>
              <h3 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                أسرع جرس: <span className="text-amber-400">{state.buzzerLockedByName}</span>!
              </h3>
              <p className="text-sm text-slate-400 mb-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
                {state.buzzerLockedByTeam === 'A' ? '🦅 ' : '🐺 '}
                {state.buzzerLockedByTeam ? room.teams[state.buzzerLockedByTeam]?.name : ''}
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => handleAssignControl('A')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-colors"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  تسليم السيطرة لـ {room.teams.A.name} 🦅
                </button>
                <button
                  onClick={() => handleAssignControl('B')}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl transition-colors"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  تسليم السيطرة لـ {room.teams.B.name} 🐺
                </button>
                <button
                  onClick={handleResetBuzzer}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl flex items-center gap-2 transition-colors"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة فتح الجرس</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <Bell className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                سباق الأجراس مفتوح! 🔔
              </h3>
              <p className="text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اللاعب الأسرع يضغط الجرس بجواله للحصول على دور فريقه
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── STEAL ATTEMPT CALLOUT ────────────────────────────────────────── */}
      {state.subPhase === 'STEAL_ATTEMPT' && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-950/70 border-2 border-red-500 rounded-3xl p-5 text-center mb-6 shadow-2xl animate-pulse"
        >
          <div className="flex items-center justify-center gap-2 text-red-400 mb-1">
            <ShieldAlert className="w-6 h-6" />
            <span className="text-xl font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>
              فرصة السرقة لـ {opposingTeamState.name}!
            </span>
          </div>
          <p className="text-slate-300 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
            إذا خمنوا أي إجابة متبقية يسرقون كامل بنك النقاط ({state.roundPot} نقطة)!
          </p>
        </motion.div>
      )}

      {/* ─── 3D FEUD ANSWER BOARD ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 mb-6">
        {state.answers.map((answer, idx) => (
          <motion.div
            key={idx}
            className={`h-20 rounded-2xl border-2 flex items-center justify-between px-6 transition-all shadow-lg ${
              answer.revealed
                ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-400 text-white'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-500'
            }`}
          >
            {answer.revealed ? (
              <>
                <span className="text-xl md:text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {answer.text}
                </span>
                <div className="w-12 h-12 bg-blue-950 border border-blue-400 rounded-xl flex items-center justify-center font-black text-xl text-amber-300 shadow-inner">
                  {answer.points}
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-black text-lg">
                  {idx + 1}
                </div>
                <span className="text-sm font-bold text-slate-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  ••••••••••••
                </span>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* ─── ROUND REVEAL TRANSITION BUTTON ───────────────────────────────── */}
      {state.subPhase === 'ROUND_REVEAL' && (
        <div className="flex justify-center mb-6">
          <button
            onClick={handleNextRound}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center gap-2 glow-emerald transition-all shadow-xl"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <span>السؤال التالي</span>
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
        </div>
      )}

      {/* ─── BOTTOM: HOST OVERRIDE DRAWER (ANSWER CONTROLS & STRIKE) ─────── */}
      <HostOverrideDrawer title="لوحة تحكم إجابات ستيف هارفي">
        <div className="space-y-4">
          <div className="text-xs text-slate-400 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            اضغط على الإجابة المطابقة لكشفها ومنح النقاط:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {state.answers.map((answer, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (state.subPhase === 'STEAL_ATTEMPT') {
                    handleStealAnswer(idx);
                  } else {
                    handleRevealAnswer(idx);
                  }
                }}
                disabled={answer.revealed}
                className={`p-2.5 rounded-xl text-right text-xs font-bold border transition-all ${
                  answer.revealed
                    ? 'bg-slate-800 border-slate-700 text-slate-500 line-through'
                    : 'bg-blue-950/60 hover:bg-blue-900 border-blue-700/60 text-white'
                }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <span className="text-amber-400 ml-1">({answer.points}ن)</span>
                <span>{answer.text}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-800">
            {state.subPhase === 'STEAL_ATTEMPT' ? (
              <button
                onClick={handleStealMiss}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-colors"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <AlertOctagon className="w-4 h-4" />
                <span>السرقة فشلت (احتفاظ الفريق الأصلي بالنقاط)</span>
              </button>
            ) : (
              <button
                onClick={handleStrike}
                disabled={state.subPhase !== 'TEAM_PLAY'}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-sm flex items-center gap-2 disabled:opacity-40 transition-colors shadow-lg"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <AlertOctagon className="w-5 h-5" />
                <span>خطأ! إعطاء سترايك (X)</span>
              </button>
            )}
          </div>
        </div>
      </HostOverrideDrawer>
    </div>
  );
}
