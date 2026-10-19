import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Users, Vote, HelpCircle, ArrowRight, Check, Eye } from 'lucide-react';
import { RoomState, SpyfallState } from '../../../types/game';
import { usePartyStore } from '../../../store/usePartyStore';
import CircularTimer from '../../shared/CircularTimer';
import HostOverrideDrawer from '../../shared/HostOverrideDrawer';

interface Props {
  room: RoomState;
  state: SpyfallState;
}

export default function SpyfallHost({ room, state }: Props) {
  const { emit } = usePartyStore();
  const [passAndPlayIdx, setPassAndPlayIdx] = useState(0);
  const [showPassRole, setShowPassRole] = useState(false);

  const players = Object.values(room.players).filter((p) => p.isConnected);
  const currentAsker = room.players[state.currentAskerId];
  const spyPlayer = room.players[state.spyDeviceId];
  const accusedPlayer = state.accusedDeviceId ? room.players[state.accusedDeviceId] : null;

  const handleStartDiscussion = () => {
    emit('spyfall:start_discussion', { roomCode: room.code });
  };

  const handleStartVoting = () => {
    emit('spyfall:start_voting', { roomCode: room.code });
  };

  const handleSpyGuess = (location: string) => {
    emit('spyfall:spy_guess', { roomCode: room.code, guessedLocation: location });
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full pb-20">
      {/* ─── HEADER: CATEGORY & TOP BANNER ───────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-3 mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>
            تصنيف الأماكن
          </span>
          <span className="text-lg font-black text-red-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {state.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span className="text-sm font-bold text-slate-300" style={{ fontFamily: 'Cairo, sans-serif' }}>
            في جاسوس واحد بينكم! 🕵️
          </span>
        </div>
      </div>

      {/* ─── SUBPHASE: ROLE DISTRIBUTION ─────────────────────────────────── */}
      {state.subPhase === 'ROLE_DISTRIBUTION' && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto w-full text-center shadow-2xl"
        >
          <div className="text-7xl mb-4">🤫</div>
          <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            توزيع الأدوار السرية
          </h2>
          <p className="text-slate-400 text-sm mb-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
            افتح جوالك واضغط مطولاً لرؤية دورك والمكان السري بدون ما يشوف أحد!
          </p>

          {/* Pass-and-play fallback if single screen mode */}
          {room.settings.singleScreenMode && players.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-right">
              <span className="text-xs text-amber-400 font-bold block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                وضع الشاشة الواحدة (مرر الجهاز):
              </span>
              <div className="text-white font-bold mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                سلّم الجهاز لـ: <span className="text-emerald-400">{players[passAndPlayIdx]?.name}</span>
              </div>
              {showPassRole ? (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-center mb-3">
                  <div className="text-sm text-slate-400 mb-1">
                    {state.playerRoles[players[passAndPlayIdx]?.deviceId] === 'الجاسوس 🕵️'
                      ? 'أنت الجاسوس (برّا السالفة)!'
                      : `المكان: ${state.secretLocation}`}
                  </div>
                  <div className="text-lg font-black text-amber-400">
                    الدور: {state.playerRoles[players[passAndPlayIdx]?.deviceId]}
                  </div>
                </div>
              ) : null}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPassRole(!showPassRole)}
                  className="flex-1 py-2 bg-slate-800 text-xs font-bold text-white rounded-xl"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  {showPassRole ? 'إخفاء الدور' : 'كشف الدور سراً'}
                </button>
                {passAndPlayIdx < players.length - 1 && (
                  <button
                    onClick={() => {
                      setShowPassRole(false);
                      setPassAndPlayIdx(passAndPlayIdx + 1);
                    }}
                    className="py-2 px-4 bg-emerald-600 text-xs font-bold text-white rounded-xl"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    التالي
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleStartDiscussion}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 glow-emerald transition-all shadow-xl"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <span>الجميع رأى دوره — بدء النقاش!</span>
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
        </motion.div>
      )}

      {/* ─── SUBPHASE: DISCUSSION (5 MIN) ─────────────────────────────────── */}
      {state.subPhase === 'DISCUSSION' && (
        <div className="flex-1 flex flex-col items-center">
          {/* Timer + Asker indicator */}
          <div className="flex items-center justify-between w-full max-w-2xl mb-6 px-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>
                يبدأ بالسؤال الأول:
              </span>
              <span className="text-xl font-black text-emerald-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                {currentAsker?.name || players[0]?.name} {currentAsker?.avatar}
              </span>
            </div>

            <CircularTimer
              timeRemaining={state.timeRemaining}
              totalTime={300}
              size={110}
              urgent={state.timeRemaining <= 30}
            />

            <button
              onClick={handleStartVoting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 transition-colors shadow-lg"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <Vote className="w-4 h-4" />
              <span>بدء التصويت الآن</span>
            </button>
          </div>

          {/* 12 Locations Matrix on TV (allows spy to observe without suspicion) */}
          <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl mb-4">
            <div className="text-xs font-bold text-slate-400 mb-3 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
              قائمة الأماكن المحتملة في هذا التصنيف:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {state.allLocationsInCategory.map((loc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center text-sm font-bold text-slate-200"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  {loc}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── SUBPHASE: VOTING ─────────────────────────────────────────────── */}
      {state.subPhase === 'VOTING' && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto w-full text-center shadow-2xl my-auto"
        >
          <Vote className="w-16 h-16 text-red-500 mx-auto mb-3 animate-pulse" />
          <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            حان وقت التصويت!
          </h2>
          <p className="text-slate-400 text-sm mb-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
            صوّتوا بجوالاتكم على الشخص اللي تشكّون إنه "برّا السالفة"
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {players.map((p) => {
              const hasVoted = Boolean(state.votes[p.deviceId]);
              return (
                <div
                  key={p.deviceId}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    hasVoted
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.avatar}</span>
                    <span className="text-sm font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {p.name}
                    </span>
                  </div>
                  {hasVoted ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      يصوت...
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-500" style={{ fontFamily: 'Cairo, sans-serif' }}>
            تم تسجيل {Object.keys(state.votes).length} من {players.length} أصوات
          </div>
        </motion.div>
      )}

      {/* ─── SUBPHASE: SPY LAST CHANCE ───────────────────────────────────── */}
      {state.subPhase === 'SPY_LAST_CHANCE' && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900/90 border-2 border-red-500 rounded-3xl p-8 max-w-2xl mx-auto w-full text-center shadow-2xl my-auto"
        >
          <span className="text-6xl mb-3 block animate-bounce">🎯</span>
          <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            تم كشف الجاسوس: <span className="text-red-400">{spyPlayer?.name}</span>!
          </h2>
          <p className="text-amber-300 font-bold text-sm mb-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
            الفرصة الأخيرة للجاسوس! خمّن المكان السري لتسرق الفوز (باقي {state.spyLastChanceTimeRemaining} ثانية):
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {state.allLocationsInCategory.map((loc, idx) => (
              <button
                key={idx}
                onClick={() => handleSpyGuess(loc)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                {loc}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── SUBPHASE: ROUND RESULT ───────────────────────────────────────── */}
      {state.subPhase === 'ROUND_RESULT' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto w-full text-center shadow-2xl my-auto"
        >
          <div className="text-7xl mb-3">
            {state.winner === 'SPY' ? '🕵️‍♂️' : '🎉'}
          </div>
          <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {state.winner === 'SPY' ? 'فاز الجاسوس!' : 'فازت الشلة!'}
          </h2>

          <div className="my-6 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-right space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>المكان السري:</span>
              <span className="text-emerald-400 font-bold">{state.secretLocation}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>الجاسوس:</span>
              <span className="text-red-400 font-bold">{spyPlayer?.name} {spyPlayer?.avatar}</span>
            </div>
            {state.accusedName && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>المشتبه به بالتصويت:</span>
                <span className="text-amber-400 font-bold">{state.accusedName}</span>
              </div>
            )}
            {state.spyGuessedLocation && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>تخمين الجاسوس للمكان:</span>
                <span className="text-white font-bold">{state.spyGuessedLocation}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── BOTTOM: HOST OVERRIDE DRAWER (CONTROLS) ─────────────────────── */}
      <HostOverrideDrawer title="تحكم المضيف المباشر">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {state.subPhase === 'ROLE_DISTRIBUTION' && (
            <button
              onClick={handleStartDiscussion}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              بدء النقاش
            </button>
          )}

          {state.subPhase === 'DISCUSSION' && (
            <button
              onClick={handleStartVoting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              بدء التصويت
            </button>
          )}

          {state.subPhase === 'VOTING' && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                تصويت سريع كـ مضيف على:
              </span>
              {players.map((p) => (
                <button
                  key={p.deviceId}
                  onClick={() => emit('spyfall:vote', { roomCode: room.code, voterDeviceId: 'host', suspectedDeviceId: p.deviceId })}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </HostOverrideDrawer>
    </div>
  );
}
