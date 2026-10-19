import { motion } from 'framer-motion';
import { Bell, Flame, ShieldAlert, Award } from 'lucide-react';
import { RoomState, FamilyFeudState, Player } from '../../../types/game';
import { usePartyStore } from '../../../store/usePartyStore';
import { haptics } from '../../../utils/haptics';

interface Props {
  room: RoomState;
  state: FamilyFeudState;
  player: Player;
}

export default function FamilyFeudController({ room, state, player }: Props) {
  const { emit } = usePartyStore();

  const isBuzzerLocked = Boolean(state.buzzerLockedBy);
  const isMyBuzzer = state.buzzerLockedBy === player.deviceId;
  const isControllingTeam = player.team === state.controllingTeam;

  const handleBuzz = () => {
    if (isBuzzerLocked) return;
    haptics.heavy();
    emit('feud:buzz', { roomCode: room.code, deviceId: player.deviceId });
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
        <div className="text-xs font-bold text-amber-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
          البنك: {state.roundPot} نقطة
        </div>
      </div>

      {/* ─── QUESTION BANNER ──────────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl my-2 text-center">
        <span className="text-[10px] text-blue-400 font-bold block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
          السؤال الحالي:
        </span>
        <h3 className="text-sm md:text-base font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {state.question}
        </h3>
      </div>

      {/* ─── SUBPHASE: FACE_OFF (BUZZER RACE) ─────────────────────────────── */}
      {state.subPhase === 'FACE_OFF' && (
        <div className="flex-1 flex flex-col items-center justify-center my-4">
          {isBuzzerLocked ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-6 rounded-3xl border-2 text-center max-w-sm w-full ${
                isMyBuzzer
                  ? 'bg-amber-950/60 border-amber-500 shadow-2xl glow-amber'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <span className="text-6xl mb-3 block">{isMyBuzzer ? '🎉' : '🔔'}</span>
              <h2 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                {isMyBuzzer ? 'أنت الأسرع في ضغط الجرس!' : `ضغط الجرس: ${state.buzzerLockedByName}`}
              </h2>
              <p className="text-slate-400 text-xs mt-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                المضيف يحدد الفريق صاحب الإجابة الأعلى على الشاشة...
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-xs">
              <button
                onClick={handleBuzz}
                className="w-56 h-56 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 border-4 border-amber-300 shadow-[0_0_50px_rgba(245,158,11,0.6)] flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform buzzer-btn"
              >
                <Bell className="w-20 h-20 fill-slate-950 stroke-[2.5] animate-bounce" />
                <span className="text-2xl font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  اضغط الجرس!
                </span>
              </button>
              <p className="text-slate-400 text-xs mt-6 text-center" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اضغط بأسرع ما عندك أول ما تعرف الإجابة!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE: TEAM_PLAY ──────────────────────────────────────────── */}
      {state.subPhase === 'TEAM_PLAY' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto p-6 bg-slate-900/60 border border-slate-800 rounded-3xl">
          {isControllingTeam ? (
            <>
              <Flame className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                فريقك مسيطر على اللوحة! 🔥
              </h2>
              <p className="text-slate-300 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اقترحوا إجابات بصوت عالي، والمضيف يكشف الإجابات على الشاشة
              </p>
            </>
          ) : (
            <>
              <ShieldAlert className="w-16 h-16 text-slate-500 mx-auto" />
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الخصم يجاوب الآن...
              </h2>
              <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                إذا غلطوا 3 مرات (XXX)، بتجيكم فرصة لسرقة كل بنك النقاط!
              </p>
            </>
          )}

          {/* Strikes count */}
          <div className="flex justify-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                  s <= state.strikes ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-600'
                }`}
              >
                X
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SUBPHASE: STEAL_ATTEMPT ──────────────────────────────────────── */}
      {state.subPhase === 'STEAL_ATTEMPT' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto p-6 bg-red-950/40 border-2 border-red-500 rounded-3xl animate-pulse">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            فرصة السرقة! 🚨
          </h2>
          <p className="text-slate-300 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {!isControllingTeam
              ? 'اتفقوا على إجابة واحدة قوية وقولوها للمضيف لسرقة كامل النقاط!'
              : 'الخصم يحاول يسرق نقاطكم... ادعوا يغلطون!'}
          </p>
        </div>
      )}

      {/* ─── SUBPHASE: ROUND_REVEAL ───────────────────────────────────────── */}
      {state.subPhase === 'ROUND_REVEAL' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto">
          <Award className="w-16 h-16 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            نهاية الجولة!
          </h2>
          <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
            المضيف يكشف باقي الإجابات على الشاشة
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2">
        <span className="text-[10px] text-slate-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
          ستيف هارفي — PartyHub
        </span>
      </div>
    </div>
  );
}
