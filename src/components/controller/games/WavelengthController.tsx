import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { RoomState, WavelengthState, Player } from '../../../types/game';
import { usePartyStore } from '../../../store/usePartyStore';
import { haptics } from '../../../utils/haptics';

interface Props {
  room: RoomState;
  state: WavelengthState;
  player: Player;
}

export default function WavelengthController({ room, state, player }: Props) {
  const { emit } = usePartyStore();

  const isPsychic = player.deviceId === state.psychicDeviceId;
  const isActiveTeam = player.team === state.activeTeam;
  const isOpposingTeam = !isActiveTeam;

  const [clueInput, setClueInput] = useState('');
  const [localDial, setLocalDial] = useState(state.teamDialValue);
  const [hasVotedSteal, setHasVotedSteal] = useState(false);

  useEffect(() => {
    setLocalDial(state.teamDialValue);
  }, [state.teamDialValue]);

  const handleSubmitClue = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.medium();
    emit('wavelength:submit_clue', {
      roomCode: room.code,
      clueText: clueInput.trim() || 'شفهي بالصوت 🗣️',
    });
  };

  const handleDialChange = (val: number) => {
    setLocalDial(val);
    haptics.light();
    emit('wavelength:move_dial', { roomCode: room.code, value: val });
  };

  const handleLockIn = () => {
    haptics.heavy();
    emit('wavelength:lock_in', { roomCode: room.code });
  };

  const handleOpponentPredict = (prediction: 'LEFT' | 'RIGHT') => {
    haptics.medium();
    setHasVotedSteal(true);
    emit('wavelength:opponent_predict', { roomCode: room.code, prediction });
  };

  return (
    <div className="h-dvh bg-slate-950 flex flex-col justify-between p-4 select-none overflow-y-auto">
      {/* ─── TOP STATUS ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar}</span>
          <span className="text-xs font-bold text-slate-300" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </span>
        </div>
        <div className="text-xs font-bold text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {isActiveTeam ? '🦅 فريقك يلعب' : '🐺 خصمك يلعب'}
        </div>
      </div>

      {/* ─── SPECTRUM POLES SUMMARY ───────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl my-2 text-center text-xs">
        <div className="flex justify-between font-bold text-white mb-1">
          <span className="text-blue-400 text-right">{state.card.leftPole} (0%)</span>
          <span className="text-purple-400 text-left">{state.card.rightPole} (100%)</span>
        </div>
        {state.clueText && (
          <div className="mt-2 text-emerald-400 font-bold text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
            التلميح: "{state.clueText}"
          </div>
        )}
      </div>

      {/* ─── SUBPHASE 1: PSYCHIC_CLUE ─────────────────────────────────────── */}
      {state.subPhase === 'PSYCHIC_CLUE' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto w-full">
          {isPsychic ? (
            <div className="space-y-4">
              <span className="text-6xl block">🔮</span>
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                أنت البيشيك!
              </h2>
              <div className="bg-slate-900 border-2 border-emerald-500/50 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">الهدف السري المطلوب:</span>
                <span className="text-4xl font-black text-emerald-400">{state.targetCenter}%</span>
                <p className="text-xs text-slate-400 mt-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  أعط تلميحاً يناسب بالضبط موقع {state.targetCenter}% بين القطبين!
                </p>
              </div>

              <form onSubmit={handleSubmitClue} className="space-y-3">
                <input
                  type="text"
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  placeholder="اكتب التلميح (أو قله بصوتك للشلة)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 glow-emerald shadow-xl"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>أعطيت التلميح — ابدأ التخمين!</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="py-8 space-y-2">
              <Sparkles className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                البيشيك يجهز تلميحه السري...
              </h3>
              <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                استمع جيداً لتلميحه أول ما يقوله
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE 2: TEAM_GUESS ───────────────────────────────────────── */}
      {state.subPhase === 'TEAM_GUESS' && (
        <div className="my-auto text-center space-y-6 max-w-sm mx-auto w-full">
          {isActiveTeam && !isPsychic ? (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                حرّك المؤشر مع فريقك!
              </h3>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <span className="text-5xl font-black text-emerald-400 block">{localDial}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localDial}
                  onChange={(e) => handleDialChange(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <button
                onClick={handleLockIn}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-lg flex items-center justify-center gap-2 glow-emerald shadow-xl active:scale-95"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <Lock className="w-5 h-5" />
                <span>تثبيت المؤشر (Lock In)</span>
              </button>
            </div>
          ) : isPsychic ? (
            <div className="py-8 space-y-2">
              <span className="text-5xl block">🤫</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                فريقك يتناقشون ويحركون المؤشر...
              </h3>
              <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                ممنوع تعطي أي تعابير وجه أو تصحيحات!
              </p>
            </div>
          ) : (
            <div className="py-8 space-y-2">
              <span className="text-5xl block">👂</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                راقب مكان المؤشر على الشاشة...
              </h3>
              <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                استعد لمرحلة السرقة فور تثبيتهم للمؤشر!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE 3: OPPONENT_STEAL ───────────────────────────────────── */}
      {state.subPhase === 'OPPONENT_STEAL' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto w-full">
          {isOpposingTeam ? (
            <div className="space-y-4">
              <span className="text-5xl block">🎯</span>
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                فرصة السرقة! (+1 نقطة)
              </h2>
              <p className="text-slate-300 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                هل الهدف الحقيقي يمين أم يسار المؤشر الحالي ({state.teamDialValue}%)؟
              </p>

              {hasVotedSteal ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 text-sm font-bold flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>تم تسجيل رهانك! بانتظار الكشف...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleOpponentPredict('LEFT')}
                    className="py-5 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-black rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xl"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    <ArrowLeft className="w-6 h-6" />
                    <span>يسار المؤشر (&lt;)</span>
                  </button>

                  <button
                    onClick={() => handleOpponentPredict('RIGHT')}
                    className="py-5 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-black rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xl"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    <ArrowRight className="w-6 h-6" />
                    <span>يمين المؤشر (&gt;)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 space-y-2">
              <span className="text-5xl block">🤞</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الفريق المنافس يراهن على موقع الهدف...
              </h3>
              <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                خل عينك على التلفزيون لكشف النتيجة!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE 4: REVEAL ───────────────────────────────────────────── */}
      {state.subPhase === 'REVEAL' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto">
          <span className="text-6xl block">🎉</span>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            تم كشف الهدف!
          </h2>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">الهدف الحقيقي:</span>
              <span className="text-emerald-400 font-bold">{state.targetCenter}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">مؤشر الفريق:</span>
              <span className="text-white font-bold">{state.teamDialValue}%</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2">
              <span className="text-slate-400">نقاط الفريق النشط:</span>
              <span className="text-emerald-400 font-black">+{state.lastRoundPoints.activeTeamEarned}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2">
        <span className="text-[10px] text-slate-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
          الطول الموجي — PartyHub
        </span>
      </div>
    </div>
  );
}
