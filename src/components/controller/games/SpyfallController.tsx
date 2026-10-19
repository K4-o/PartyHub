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
    <div className="h-dvh playful-bg flex flex-col justify-between p-4 select-none overflow-y-auto">
      {/* ─── TOP STATUS ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar}</span>
          <span className="text-xs font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </span>
        </div>
        <div className="text-xs font-black text-rose-300 bg-rose-400/20 border border-rose-400/30 px-3 py-1 rounded-xl" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {state.category} 🗺️
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
          className={`p-5 rounded-3xl border-2 text-center transition-all cursor-pointer shadow-xl ${
            isRevealingRole
              ? isSpy
                ? 'bg-gradient-to-b from-red-600 to-rose-700 border-white text-white shadow-2xl scale-[1.02]'
                : 'bg-gradient-to-b from-emerald-600 to-teal-700 border-white text-white shadow-2xl scale-[1.02]'
              : 'playful-card hover:border-white/30'
          }`}
        >
          {isRevealingRole ? (
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              {isSpy ? (
                <>
                  <span className="text-5xl block mb-2 animate-bounce">🕵️‍♂️</span>
                  <div className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    أنت الجاسوس (برّا السالفة)!
                  </div>
                  <p className="text-xs text-white/90 mt-1 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    لا توضح لأحد إنك ما تدري وين المكان! خمن المكان من القائمة بالأسفل.
                  </p>
                </>
              ) : (
                <>
                  <span className="text-xs text-emerald-200 font-bold block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    المكان السري:
                  </span>
                  <div className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {state.secretLocation}
                  </div>
                  <div className="text-xs text-white/90 font-bold bg-white/20 py-1 px-3 rounded-full inline-block" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    دورك: <span className="underline font-black">{myRole}</span>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center gap-1.5 text-white/70">
              <Eye className="w-7 h-7 text-amber-300 animate-pulse" />
              <span className="text-sm font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اضغط مطولاً لكشف بطاقتك السرية 🕵️‍♂️
              </span>
              <span className="text-[11px] text-white/50 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
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
            <span className="text-xs font-black text-white/80" style={{ fontFamily: 'Cairo, sans-serif' }}>
              قائمة الأماكن (المس للشطب):
            </span>
            <button
              onClick={handleStartVoting}
              className="btn-playful-red px-3.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
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
                  className={`p-3 rounded-2xl border text-xs font-black text-right transition-all flex items-center justify-between shadow-sm cursor-pointer ${
                    isCrossed
                      ? 'bg-black/20 border-white/5 text-white/30 line-through'
                      : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                  }`}
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <span>{loc}</span>
                  {isCrossed && <Check className="w-4 h-4 text-white/40" />}
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
            <Vote className="w-10 h-10 text-rose-400 mx-auto mb-1 animate-pulse" />
            <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              صوّت: مين برّا السالفة؟
            </h3>
            <p className="text-xs text-white/70 font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
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
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer shadow-md ${
                    isVoted
                      ? 'bg-rose-600 border-white text-white scale-[1.02]'
                      : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.avatar}</span>
                    <span className="text-sm font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {p.name} {p.deviceId === player.deviceId && '(أنت)'}
                    </span>
                  </div>
                  {isVoted && (
                    <span className="text-xs text-amber-200 font-black bg-black/20 px-2 py-0.5 rounded-full" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      تم اختيارك ✓
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
              <h2 className="text-xl font-black text-rose-300" style={{ fontFamily: 'Cairo, sans-serif' }}>
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
                    className="p-3 bg-white/10 hover:bg-rose-600/80 border border-white/20 hover:border-white rounded-2xl text-xs font-black text-white transition-all cursor-pointer"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-2 playful-card p-6">
              <span className="text-5xl block animate-pulse">⏳</span>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الجاسوس يحاول تخمين المكان الآن...
              </h3>
              <p className="text-white/60 text-xs font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
                خل عينك على شاشة التلفزيون لمعرفة النتيجة!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE: ROUND_RESULT ───────────────────────────────────────── */}
      {state.subPhase === 'ROUND_RESULT' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto playful-card p-6">
          <span className="text-6xl block animate-bounce">{state.winner === 'SPY' ? '🕵️‍♂️' : '🎉'}</span>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {state.winner === 'SPY' ? 'فاز الجاسوس!' : 'فازت الشلة!'}
          </h2>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 text-xs space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-white/70" style={{ fontFamily: 'Cairo, sans-serif' }}>المكان السري:</span>
              <span className="text-emerald-300 font-black">{state.secretLocation}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-white/70" style={{ fontFamily: 'Cairo, sans-serif' }}>نقاطك الحالية:</span>
              <span className="text-amber-300 font-black">{player.score} نقطة</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-1">
        <span className="text-[11px] text-white/40 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
          برّا السالفة — PartyHub 🕵️‍♂️
        </span>
      </div>
    </div>
  );
}
