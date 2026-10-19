import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Vote, Check, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { RoomState, SpyfallState, Player } from '../../../types/game';
import { usePartyStore } from '../../../store/usePartyStore';
import { haptics } from '../../../utils/haptics';

interface Props {
  room: RoomState;
  state: SpyfallState;
  player: Player;
}

export default function SpyfallController({ room, state, player }: Props) {
  const { emit } = usePartyStore();

  const isSpy = player.deviceId === state.spyDeviceId;
  const myRole = state.playerRoles[player.deviceId] || 'عضو في المكان';

  const [isRevealingRole, setIsRevealingRole] = useState(false);
  const [crossedOutLocations, setCrossedOutLocations] = useState<Record<string, boolean>>({});
  const [votedSuspect, setVotedSuspect] = useState<string | null>(state.votes[player.deviceId] || null);

  const players = Object.values(room.players).filter((p) => p.isConnected);

  const toggleCrossLocation = (loc: string) => {
    haptics.light();
    setCrossedOutLocations((prev) => ({ ...prev, [loc]: !prev[loc] }));
  };

  const handleVote = (suspectedDeviceId: string) => {
    if (votedSuspect) return;
    haptics.heavy();
    setVotedSuspect(suspectedDeviceId);
    emit('spyfall:vote', {
      roomCode: room.code,
      voterDeviceId: player.deviceId,
      suspectedDeviceId,
    });
  };

  const handleSpyGuess = (location: string) => {
    haptics.heavy();
    emit('spyfall:spy_guess', { roomCode: room.code, guessedLocation: location });
  };

  const handleStartVoting = () => {
    haptics.medium();
    emit('spyfall:start_voting', { roomCode: room.code });
  };

  return (
    <div className="h-dvh bg-slate-950 flex flex-col justify-between p-4 select-none overflow-y-auto">
      {/* ─── TOP STATUS ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar}</span>
          <span className="text-xs font-bold text-slate-300" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </span>
        </div>
        <div className="text-xs font-bold text-red-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {state.category}
        </div>
      </div>

      {/* ─── PRIVACY ROLE CARD (PRESS & HOLD TO REVEAL) ────────────────────── */}
      <div className="my-2">
        <div
          onPointerDown={() => {
            haptics.light();
            setIsRevealingRole(true);
          }}
          onPointerUp={() => setIsRevealingRole(false)}
          onPointerLeave={() => setIsRevealingRole(false)}
          className={`p-4 rounded-3xl border-2 text-center transition-all cursor-pointer ${
            isRevealingRole
              ? isSpy
                ? 'bg-red-950 border-red-500 shadow-2xl'
                : 'bg-emerald-950 border-emerald-500 shadow-2xl'
              : 'bg-slate-900 border-slate-700 hover:border-slate-600'
          }`}
        >
          {isRevealingRole ? (
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              {isSpy ? (
                <>
                  <span className="text-5xl block mb-1">🕵️‍♂️</span>
                  <div className="text-xl font-black text-red-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    أنت الجاسوس (برّا السالفة)!
                  </div>
                  <p className="text-xs text-red-200 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    لا توضح لأحد إنك ما تدري وين المكان! خمن المكان من القائمة بالأسفل.
                  </p>
                </>
              ) : (
                <>
                  <span className="text-xs text-emerald-400 font-bold block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    المكان السري:
                  </span>
                  <div className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {state.secretLocation}
                  </div>
                  <div className="text-xs text-emerald-300 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    دورك: <span className="underline">{myRole}</span>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <div className="py-3 flex flex-col items-center justify-center gap-1.5 text-slate-400">
              <Eye className="w-6 h-6 text-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اضغط مطولاً لكشف بطاقتك السرية 🕵️‍♂️
              </span>
              <span className="text-[10px] text-slate-500" style={{ fontFamily: 'Cairo, sans-serif' }}>
                ارفع إصبعك للإخفاء الفوري
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── SUBPHASE: DISCUSSION ─────────────────────────────────────────── */}
      {state.subPhase === 'DISCUSSION' && (
        <div className="flex-1 flex flex-col my-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
              قائمة الأماكن (المس للشطب):
            </span>
            <button
              onClick={handleStartVoting}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <Vote className="w-3.5 h-3.5" />
              <span>بدء التصويت</span>
            </button>
          </div>

          {/* Interactive Checklist of 12 Locations */}
          <div className="grid grid-cols-2 gap-2 flex-1 max-h-72 overflow-y-auto pr-1">
            {state.allLocationsInCategory.map((loc, idx) => {
              const isCrossed = crossedOutLocations[loc];
              return (
                <button
                  key={idx}
                  onClick={() => toggleCrossLocation(loc)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center justify-between ${
                    isCrossed
                      ? 'bg-slate-900/40 border-slate-800 text-slate-600 line-through'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <span>{loc}</span>
                  {isCrossed && <Check className="w-3.5 h-3.5 text-slate-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── SUBPHASE: VOTING ─────────────────────────────────────────────── */}
      {state.subPhase === 'VOTING' && (
        <div className="flex-1 flex flex-col justify-center my-2 max-w-sm mx-auto w-full">
          <div className="text-center mb-4">
            <Vote className="w-10 h-10 text-red-500 mx-auto mb-1 animate-pulse" />
            <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              صوّت: مين برّا السالفة؟
            </h3>
            <p className="text-xs text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
              اختر الشخص اللي تشك إنه الجاسوس
            </p>
          </div>

          <div className="space-y-2">
            {players.map((p) => {
              const isVoted = votedSuspect === p.deviceId;
              return (
                <button
                  key={p.deviceId}
                  onClick={() => handleVote(p.deviceId)}
                  disabled={Boolean(votedSuspect)}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isVoted
                      ? 'bg-red-950/80 border-red-500 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.avatar}</span>
                    <span className="text-sm font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {p.name} {p.deviceId === player.deviceId && '(أنت)'}
                    </span>
                  </div>
                  {isVoted && (
                    <span className="text-xs text-red-400 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      تم اختيارك
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── SUBPHASE: SPY LAST CHANCE ───────────────────────────────────── */}
      {state.subPhase === 'SPY_LAST_CHANCE' && (
        <div className="flex-1 flex flex-col justify-center my-2 max-w-sm mx-auto w-full">
          {isSpy ? (
            <div className="text-center space-y-4">
              <span className="text-5xl block animate-bounce">🎯</span>
              <h2 className="text-xl font-black text-red-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                كشفوك! لكن باقي فرصة أخيرة للفوز:
              </h2>
              <p className="text-xs text-amber-300 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اختر المكان السري الصحيح من القائمة لسرقة الفوز!
              </p>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {state.allLocationsInCategory.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSpyGuess(loc)}
                    className="p-3 bg-slate-900 hover:bg-red-900/60 border border-slate-700 hover:border-red-500 rounded-xl text-xs font-bold text-white transition-colors"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <span className="text-5xl block">⏳</span>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الجاسوس يحاول تخمين المكان الآن...
              </h3>
              <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                خل عينك على شاشة التلفزيون لمعرفة النتيجة!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE: ROUND_RESULT ───────────────────────────────────────── */}
      {state.subPhase === 'ROUND_RESULT' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto">
          <span className="text-6xl block">{state.winner === 'SPY' ? '🕵️‍♂️' : '🎉'}</span>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {state.winner === 'SPY' ? 'فاز الجاسوس!' : 'فازت الشلة!'}
          </h2>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">المكان السري:</span>
              <span className="text-emerald-400 font-bold">{state.secretLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">نقاطك الحالية:</span>
              <span className="text-amber-400 font-bold">{player.score} نقطة</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2">
        <span className="text-[10px] text-slate-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
          برّا السالفة — PartyHub
        </span>
      </div>
    </div>
  );
}
