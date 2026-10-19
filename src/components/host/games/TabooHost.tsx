import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Play, CheckCircle2, XCircle, SkipForward, ArrowRight } from 'lucide-react';
import { RoomState, TabooState } from '../../../types/game';
import { usePartyStore } from '../../../store/usePartyStore';
import CircularTimer from '../../shared/CircularTimer';
import ScoreBanner from '../../shared/ScoreBanner';
import HostOverrideDrawer from '../../shared/HostOverrideDrawer';

interface Props {
  room: RoomState;
  state: TabooState;
}

export default function TabooHost({ room, state }: Props) {
  const { emit } = usePartyStore();
  const [showCardOnTV, setShowCardOnTV] = useState(room.settings.singleScreenMode);

  const activeTeamState = room.teams[state.activeTeam];
  const opposingTeamId = state.activeTeam === 'A' ? 'B' : 'A';
  const describerPlayer = room.players[state.describerDeviceId];
  const auditorPlayer = room.players[state.auditorDeviceId];

  const handleStartTurn = () => {
    emit('taboo:start_turn', { roomCode: room.code });
  };

  const handleNextTurn = () => {
    emit('taboo:next_turn', { roomCode: room.code });
  };

  const handleAction = (action: 'CORRECT' | 'PASS' | 'VIOLATION') => {
    emit('taboo:action', { roomCode: room.code, action });
  };

  const handleCorrectHistory = (index: number, outcome: 'CORRECT' | 'PASS' | 'VIOLATION') => {
    emit('taboo:correct_history', { roomCode: room.code, index, outcome });
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full pb-20">
      {/* ─── TOP: SCORE BANNER ────────────────────────────────────────────── */}
      <div className="mb-6">
        <ScoreBanner teams={room.teams} activeTeam={state.activeTeam} />
      </div>

      {/* ─── MIDDLE: SUBPHASE CONTENT ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* SUBPHASE: TURN_READY */}
        {state.subPhase === 'TURN_READY' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-xl w-full text-center shadow-2xl"
          >
            <div className="text-sm font-bold text-slate-400 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              الجولة {state.roundNumber} من {state.maxRounds}
            </div>
            <h2
              className={`text-3xl font-black mb-6 ${
                state.activeTeam === 'A' ? 'text-emerald-400' : 'text-violet-400'
              }`}
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              دور {activeTeamState.name}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                <span className="text-3xl mb-1 block">🗣️</span>
                <span className="text-xs text-slate-400 block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  الواصف
                </span>
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {describerPlayer?.name || 'متحكم الشاشة'}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                <span className="text-3xl mb-1 block">👀</span>
                <span className="text-xs text-slate-400 block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  المراقب ({room.teams[opposingTeamId].name})
                </span>
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {auditorPlayer?.name || 'متحكم الشاشة'}
                </span>
              </div>
            </div>

            <button
              onClick={handleStartTurn}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-lg flex items-center justify-center gap-2 glow-emerald transition-all"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <Play className="w-6 h-6 fill-slate-950" />
              <span>ابدأ العداد (60 ثانية)</span>
            </button>
          </motion.div>
        )}

        {/* SUBPHASE: DESCRIBING */}
        {state.subPhase === 'DESCRIBING' && (
          <div className="w-full flex flex-col items-center">
            {/* Timer + Round details */}
            <div className="flex items-center justify-between w-full max-w-2xl mb-6 px-4">
              <div className="text-right">
                <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  الواصف الحالي:
                </span>
                <span className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {describerPlayer?.name || 'متحكم الشاشة'}
                </span>
              </div>

              <CircularTimer
                timeRemaining={state.timeRemaining}
                totalTime={room.settings.roundDurationSeconds}
                size={110}
              />

              <div className="text-left">
                <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  إجابات صحيحة:
                </span>
                <span className="text-3xl font-black text-emerald-400">
                  +{state.turnStats.correctCount}
                </span>
              </div>
            </div>

            {/* Secret Card View / Blurred TV Area */}
            <div className="w-full max-w-md relative">
              <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 text-center relative overflow-hidden shadow-2xl">
                {showCardOnTV && state.currentCard ? (
                  <div>
                    <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full mb-3 inline-block" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {state.currentCard.category}
                    </span>
                    <h2 className="text-4xl font-black text-white mb-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {state.currentCard.word}
                    </h2>
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-red-400 block mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                        الكلمات الممنوعة (ممنوع تنطقها!):
                      </span>
                      {state.currentCard.forbidden.map((word, idx) => (
                        <div
                          key={idx}
                          className="bg-red-950/60 border border-red-800/40 text-red-200 py-1.5 px-4 rounded-xl font-bold text-base"
                          style={{ fontFamily: 'Cairo, sans-serif' }}
                        >
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <span className="text-6xl mb-4">🤫</span>
                    <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      البطاقة ظاهرة في جوال الواصف
                    </h3>
                    <p className="text-slate-400 text-sm max-w-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      خمنوا الكلمة مع زميلكم بدون ما تشوفون الكلمات الممنوعة!
                    </p>
                  </div>
                )}
              </div>

              {/* Show/Hide Card on TV Toggle */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowCardOnTV(!showCardOnTV)}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  {showCardOnTV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showCardOnTV ? 'إخفاء البطاقة عن الشاشة' : 'إظهار البطاقة على الشاشة (للعب المباشر)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBPHASE: TURN_SUMMARY */}
        {state.subPhase === 'TURN_SUMMARY' && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl"
          >
            <h3 className="text-2xl font-black text-center text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
              انتهى وقت الجولة! ⏰
            </h3>
            <p className="text-center text-slate-400 text-sm mb-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
              ملخص كلمات الجولة (يمكن تعديل أي خطأ بالضغط على النتيجة)
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-2xl">
                <span className="text-2xl font-black text-emerald-400">+{state.turnStats.correctCount}</span>
                <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>إجابات صحيحة</span>
              </div>
              <div className="bg-amber-950/40 border border-amber-800/40 p-3 rounded-2xl">
                <span className="text-2xl font-black text-amber-400">{state.turnStats.passCount}</span>
                <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>تخطي</span>
              </div>
              <div className="bg-red-950/40 border border-red-800/40 p-3 rounded-2xl">
                <span className="text-2xl font-black text-red-400">-{state.turnStats.violationCount}</span>
                <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>مخالفات</span>
              </div>
            </div>

            {/* History correction list */}
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
              {state.turnStats.history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-sm"
                >
                  <span className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {item.word}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCorrectHistory(idx, 'CORRECT')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        item.outcome === 'CORRECT'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                      }`}
                      style={{ fontFamily: 'Cairo, sans-serif' }}
                    >
                      صح (+1)
                    </button>
                    <button
                      onClick={() => handleCorrectHistory(idx, 'PASS')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        item.outcome === 'PASS'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-amber-400'
                      }`}
                      style={{ fontFamily: 'Cairo, sans-serif' }}
                    >
                      تخطي
                    </button>
                    <button
                      onClick={() => handleCorrectHistory(idx, 'VIOLATION')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        item.outcome === 'VIOLATION'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-red-400'
                      }`}
                      style={{ fontFamily: 'Cairo, sans-serif' }}
                    >
                      مخالفة (-1)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleNextTurn}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 glow-emerald transition-all"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <span>انتقال لدور الفريق التالي</span>
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          </motion.div>
        )}
      </div>

      {/* ─── BOTTOM: HOST OVERRIDE DRAWER (DIRECT CONTROLS) ──────────────── */}
      <HostOverrideDrawer title="تحكم المضيف المباشر">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => handleAction('CORRECT')}
            disabled={state.subPhase !== 'DESCRIBING'}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center gap-2 disabled:opacity-40 transition-colors"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>صح (+1)</span>
          </button>
          <button
            onClick={() => handleAction('PASS')}
            disabled={state.subPhase !== 'DESCRIBING' || state.passesUsed >= 3}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl flex items-center gap-2 disabled:opacity-40 transition-colors"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <SkipForward className="w-5 h-5" />
            <span>تخطي (باقي {3 - state.passesUsed})</span>
          </button>
          <button
            onClick={() => handleAction('VIOLATION')}
            disabled={state.subPhase !== 'DESCRIBING'}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl flex items-center gap-2 disabled:opacity-40 transition-colors"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <XCircle className="w-5 h-5" />
            <span>مخالفة (-1)</span>
          </button>
        </div>
      </HostOverrideDrawer>
    </div>
  );
}
