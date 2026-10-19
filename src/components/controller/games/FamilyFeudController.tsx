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
    <div className="h-dvh playful-bg flex flex-col justify-between p-4 select-none overflow-hidden">
      {/* ─── TOP STATUS ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar}</span>
          <span className="text-xs font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </span>
        </div>
        <div className="text-xs font-black text-amber-300 bg-amber-400/20 border border-amber-400/30 px-3 py-1 rounded-xl" style={{ fontFamily: 'Cairo, sans-serif' }}>
          البنك: {state.roundPot} نقطة 💰
        </div>
      </div>

      {/* ─── QUESTION BANNER ──────────────────────────────────────────────── */}
      <div className="playful-card p-4 my-2 text-center shadow-xl">
        <span className="text-[11px] text-amber-300 font-black block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
          السؤال الحالي:
        </span>
        <h3 className="text-sm md:text-base font-black text-white leading-relaxed" style={{ fontFamily: 'Cairo, sans-serif' }}>
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
              className={`p-6 rounded-3xl border-2 text-center max-w-sm w-full shadow-2xl ${
                isMyBuzzer
                  ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/30 border-amber-400'
                  : 'playful-card'
              }`}
            >
              <span className="text-6xl mb-3 block animate-bounce">{isMyBuzzer ? '🎉' : '🔔'}</span>
              <h2 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                {isMyBuzzer ? 'أنت الأسرع في ضغط الجرس!' : `ضغط الجرس: ${state.buzzerLockedByName}`}
              </h2>
              <p className="text-white/70 text-xs mt-2 font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
                المضيف يحدد الفريق صاحب الإجابة الأعلى على الشاشة...
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-xs">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleBuzz}
                className="w-56 h-56 rounded-full bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-amber-950 border-4 border-amber-200 shadow-[0_12px_0_#b45309,0_20px_40px_rgba(245,158,11,0.5)] flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform"
              >
                <Bell className="w-20 h-20 fill-amber-950 stroke-[2.5] animate-bounce" />
                <span className="text-2xl font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  اضغط الجرس!
                </span>
              </motion.button>
              <p className="text-white/60 text-xs mt-6 text-center font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اضغط بأسرع ما عندك أول ما تعرف الإجابة! ⚡
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE: TEAM_PLAY ──────────────────────────────────────────── */}
      {state.subPhase === 'TEAM_PLAY' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto p-6 playful-card">
          {isControllingTeam ? (
            <>
              <Flame className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                فريقك مسيطر على اللوحة! 🔥
              </h2>
              <p className="text-white/70 text-xs font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اقترحوا إجابات بصوت عالي، والمضيف يكشف الإجابات على الشاشة
              </p>
            </>
          ) : (
            <>
              <ShieldAlert className="w-16 h-16 text-white/50 mx-auto" />
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الخصم يجاوب الآن... 👀
              </h2>
              <p className="text-white/70 text-xs font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
                إذا غلطوا 3 مرات (XXX)، بتجيكم فرصة لسرقة كل بنك النقاط!
              </p>
            </>
          )}

          {/* Strikes count */}
          <div className="flex justify-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base shadow-md transition-all ${
                  s <= state.strikes
                    ? 'bg-red-500 text-white border-2 border-red-300 scale-110'
                    : 'bg-white/10 text-white/20 border border-white/10'
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
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto p-6 bg-red-950/60 border-2 border-red-500/80 rounded-3xl shadow-2xl animate-pulse">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            فرصة السرقة! 🚨
          </h2>
          <p className="text-white/80 text-xs font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {!isControllingTeam
              ? 'اتفقوا على إجابة واحدة قوية وقولوها للمضيف لسرقة كامل النقاط!'
              : 'الخصم يحاول يسرق نقاطكم... ادعوا يغلطون!'}
          </p>
        </div>
      )}

      {/* ─── SUBPHASE: ROUND_REVEAL ───────────────────────────────────────── */}
      {state.subPhase === 'ROUND_REVEAL' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto playful-card p-6">
          <Award className="w-16 h-16 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            نهاية الجولة!
          </h2>
          <p className="text-white/60 text-xs font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            المضيف يكشف باقي الإجابات على الشاشة 📺
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-1">
        <span className="text-[11px] text-white/40 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
          ستيف هارفي — PartyHub 🎤
        </span>
      </div>
    </div>
  );
}
