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
    <div className="h-dvh bg-slate-950 flex flex-col justify-between p-6 select-none overflow-y-auto">
      {/* Top bar with Room Code */}
      <div className="flex items-center justify-between">
        <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-xs text-slate-400">
          كود: <span className="text-emerald-400 font-bold">{room.code}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
            متصل
          </span>
        </div>
      </div>

      {/* Player Identity Card */}
      <div className="max-w-sm mx-auto w-full my-auto text-center space-y-6">
        <div className="relative inline-block">
          <span className="text-7xl block p-4 bg-slate-900/80 border-2 border-slate-800 rounded-3xl shadow-xl">
            {player.avatar}
          </span>
          {player.isReady && (
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-slate-950 shadow-md">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </h2>
          <p className="text-slate-400 text-xs mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
            في انتظار اختيار المضيف للعبة...
          </p>
        </div>

        {/* Team Card & Switcher */}
        <div
          className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-colors ${
            player.team === 'A'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
              : 'bg-violet-950/40 border-violet-500/50 text-violet-400'
          }`}
        >
          <div className="text-right">
            <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>
              فريقك:
            </span>
            <span className="text-lg font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {player.team === 'A' ? '🦅 فريق الصقور' : '🐺 فريق الذئاب'}
            </span>
          </div>

          <button
            onClick={handleSwitchTeam}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 font-bold transition-colors"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>تبديل</span>
          </button>
        </div>

        {/* Teammates List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-right">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            <Users className="w-3.5 h-3.5" />
            <span>أعضاء فريقك ({teamMembers.length}):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map((m) => (
              <span
                key={m.deviceId}
                className="inline-flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <span>{m.avatar}</span>
                <span>{m.name}</span>
                {m.deviceId === player.deviceId && <span className="text-emerald-400 text-[10px]">(أنت)</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Ready Button */}
        <button
          onClick={handleToggleReady}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
            player.isReady
              ? 'bg-slate-800 border-2 border-emerald-500 text-emerald-400'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 glow-emerald'
          }`}
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          {player.isReady ? (
            <>
              <Check className="w-6 h-6 stroke-[3]" />
              <span>أنت جاهز! (اضغط للإلغاء)</span>
            </>
          ) : (
            <span>أنا جاهز للعب! 🔥</span>
          )}
        </button>
      </div>

      <div className="text-center pb-2">
        <span className="text-xs text-slate-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
          خل عينك على شاشة التلفزيون
        </span>
      </div>
    </div>
  );
}
