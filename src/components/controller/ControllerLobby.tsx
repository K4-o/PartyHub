import { motion } from 'framer-motion';
import { Check, ArrowRightLeft, Users } from 'lucide-react';
import { RoomState, Player } from '../../types/game';
import { usePartyStore } from '../../store/usePartyStore';
import { haptics } from '../../utils/haptics';

interface Props {
  room: RoomState;
  player: Player;
}

export default function ControllerLobby({ room, player }: Props) {
  const { emit } = usePartyStore();

  const handleToggleReady = () => {
    haptics.medium();
    emit('player:ready', { roomCode: room.code, deviceId: player.deviceId });
  };

  const handleSwitchTeam = () => {
    haptics.light();
    const newTeam = player.team === 'A' ? 'B' : 'A';
    emit('player:change_team', { roomCode: room.code, deviceId: player.deviceId, team: newTeam });
  };

  const teamMembers = Object.values(room.players).filter(
    (p) => p.team === player.team && p.isConnected
  );

  return (
    <div className="h-dvh playful-bg flex flex-col justify-between p-5 select-none overflow-y-auto">
      {/* Top bar with Room Code & Connection */}
      <div className="flex items-center justify-between">
        <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-2xl text-xs text-white/80 font-bold shadow-sm">
          غرفة: <span className="text-amber-300 font-black tracking-wider text-sm">{room.code}</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-300 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            متصل بالخادم
          </span>
        </div>
      </div>

      {/* Player Identity Card */}
      <div className="max-w-sm mx-auto w-full my-auto text-center space-y-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="relative inline-block"
        >
          <div className="w-28 h-28 mx-auto bg-gradient-to-b from-white/20 to-white/5 border-3 border-white/25 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-lg">
            <span className="text-6xl drop-shadow-md select-none">{player.avatar}</span>
          </div>
          {player.isReady && (
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-2xl bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          )}
        </motion.div>

        <div>
          <h2 className="text-2xl font-black text-white drop-shadow-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </h2>
          <p className="text-white/60 text-xs mt-1 font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
            في انتظار اختيار المضيف للعبة... 🎮
          </p>
        </div>

        {/* Team Card & Switcher */}
        <div
          className={`p-4 rounded-3xl border-2 flex items-center justify-between shadow-xl transition-all ${
            player.team === 'A'
              ? 'bg-gradient-to-r from-emerald-950/70 to-teal-900/60 border-emerald-400/50'
              : 'bg-gradient-to-r from-purple-950/70 to-indigo-900/60 border-purple-400/50'
          }`}
        >
          <div className="text-right">
            <span className="text-[11px] text-white/60 block font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              فريقك الحالي:
            </span>
            <span className="text-lg font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {player.team === 'A' ? '🦅 ' : '🐺 '}
              {room.teams[player.team]?.name || (player.team === 'A' ? 'فريق الصقور' : 'فريق الذئاب')}
            </span>
          </div>

          <button
            onClick={handleSwitchTeam}
            className="btn-playful-slate px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>تبديل الفريق</span>
          </button>
        </div>

        {/* Teammates List */}
        <div className="playful-card p-4 text-right">
          <div className="flex items-center gap-1.5 text-xs text-white/70 mb-2.5 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>أعضاء فريقك ({teamMembers.length}):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map((m) => (
              <span
                key={m.deviceId}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 rounded-2xl text-xs font-bold text-white shadow-sm"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <span className="text-base">{m.avatar}</span>
                <span>{m.name}</span>
                {m.deviceId === player.deviceId && (
                  <span className="text-amber-300 text-[10px] bg-amber-400/20 px-1.5 py-0.2 rounded-full font-black">
                    أنت
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Big Tactile Ready Button */}
        <button
          onClick={handleToggleReady}
          className={`w-full py-4 text-base font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            player.isReady
              ? 'btn-playful-mint'
              : 'btn-playful-peach text-lg'
          }`}
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          {player.isReady ? (
            <>
              <Check className="w-5 h-5 stroke-[3]" />
              <span>أنت جاهز! (اضغط للإلغاء)</span>
            </>
          ) : (
            <span>أنا جاهز للعب! 🔥</span>
          )}
        </button>
      </div>

      <div className="text-center pb-1">
        <span className="text-xs text-white/40 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
          خل عينك على شاشة التلفزيون 📺
        </span>
      </div>
    </div>
  );
}

