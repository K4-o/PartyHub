import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowLeft, ArrowRight, Check, Minus, Plus } from 'lucide-react';
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

  // Reset steal vote state when phase changes
  useEffect(() => {
    if (state.subPhase !== 'OPPONENT_STEAL') {
      setHasVotedSteal(false);
    }
  }, [state.subPhase]);

  const handleSubmitClue = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.medium();
    emit('wavelength:submit_clue', {
      roomCode: room.code,
      clueText: clueInput.trim() || 'شفهي بالصوت 🗣️',
    });
  };

  const handleDialChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setLocalDial(clamped);
    haptics.light();
    emit('wavelength:move_dial', { roomCode: room.code, value: clamped });
  };

  const adjustDial = (delta: number) => {
    handleDialChange(localDial + delta);
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

  const myTeamName = room.teams[player.team]?.name || (player.team === 'A' ? 'فريق A' : 'فريق B');
  const activeTeamName = room.teams[state.activeTeam]?.name || (state.activeTeam === 'A' ? 'فريق A' : 'فريق B');

  // Mini-gauge calculation for Psychic secret view
  const targetAngle = (state.targetCenter / 100) * 180 - 90;

  return (
    <div className="h-dvh bg-slate-950 flex flex-col justify-between p-4 select-none overflow-y-auto">
      {/* ─── TOP STATUS HEADER ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar}</span>
          <span className="text-xs font-bold text-slate-300" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${player.team === 'A' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>
            {myTeamName}
          </span>
        </div>
        <div className="text-xs font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {isActiveTeam ? (
            <span className="text-emerald-400">دور فريقك يلعب 🦅</span>
          ) : (
            <span className="text-violet-400">دور {activeTeamName} 🐺</span>
          )}
        </div>
      </div>

      {/* ─── SPECTRUM POLES SUMMARY (Pinned physical Left / Right) ────────── */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl my-2 text-center text-xs shadow-lg">
        <div className="grid grid-cols-2 gap-2 font-bold mb-1" style={{ direction: 'ltr' }}>
          <div className="bg-blue-950/40 border border-blue-700/40 p-2 rounded-xl text-left">
            <span className="text-[10px] text-blue-400 block mb-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>
              ⬅️ القطب الأيسر (0%)
            </span>
            <span className="text-sm font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.card.leftPole}
            </span>
          </div>

          <div className="bg-purple-950/40 border border-purple-700/40 p-2 rounded-xl text-right">
            <span className="text-[10px] text-purple-400 block mb-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>
              القطب الأيمن (100%) ➡️
            </span>
            <span className="text-sm font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.card.rightPole}
            </span>
          </div>
        </div>

        {state.clueText && (
          <div className="mt-2 text-emerald-400 font-bold text-sm bg-emerald-950/40 border border-emerald-500/30 py-1.5 px-3 rounded-xl inline-block" style={{ fontFamily: 'Cairo, sans-serif' }}>
            التلميح: "{state.clueText}"
          </div>
        )}
      </div>

      {/* ─── SUBPHASE 1: PSYCHIC_CLUE ─────────────────────────────────────── */}
      {state.subPhase === 'PSYCHIC_CLUE' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto w-full">
          {isPsychic ? (
            <div className="space-y-4">
              <span className="text-5xl block animate-bounce">🔮</span>
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                أنت البيشيك!
              </h2>

              {/* Private Secret Target Display */}
              <div className="bg-slate-900 border-2 border-emerald-500/60 p-4 rounded-3xl shadow-2xl space-y-3">
                <span className="text-xs text-slate-400 block" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  موقع الهدف السري المطلوب:
                </span>
                <span className="text-5xl font-black text-emerald-400 font-mono block">
                  {state.targetCenter}%
                </span>

                {/* Psychic Mini-Gauge Preview */}
                <div className="relative w-full max-w-[240px] mx-auto aspect-[2/1] overflow-hidden flex items-end justify-center">
                  <div className="absolute inset-0 rounded-t-full bg-slate-950 border-t-2 border-x-2 border-slate-700" />
                  {/* Needle pointing to target */}
                  <div
                    className="absolute bottom-0 left-1/2 w-1.5 h-[85%] bg-emerald-400 origin-bottom -translate-x-1/2 rounded-t-full shadow-[0_0_10px_#34d399]"
                    style={{ transform: `translateX(-50%) rotate(${targetAngle}deg)` }}
                  />
                  {/* Pivot cap */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-slate-800 border-2 border-emerald-500" />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 px-2" style={{ direction: 'ltr', fontFamily: 'Cairo, sans-serif' }}>
                  <span className="text-blue-400">0% (يسار)</span>
                  <span className="text-emerald-300 font-bold">الهدف: {state.targetCenter}%</span>
                  <span className="text-purple-400">100% (يمين)</span>
                </div>

                <p className="text-xs text-slate-300 mt-2 font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  أعط تلميحاً ذكياً يناسب موقع {state.targetCenter}% بدقة بين القطبين!
                </p>
              </div>

              <form onSubmit={handleSubmitClue} className="space-y-3">
                <input
                  type="text"
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  placeholder="اكتب التلميح (أو قله بصوتك للمجلس)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 font-bold"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 glow-emerald shadow-xl transition-all"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>أرسل التلميح — ابدأ التخمين!</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="py-8 space-y-3">
              <Sparkles className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                البيشيك يجهز تلميحه السري...
              </h3>
              <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                استمع جيداً لتلميح البيشيك فور نطقه!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE 2: TEAM_GUESS ───────────────────────────────────────── */}
      {state.subPhase === 'TEAM_GUESS' && (
        <div className="my-auto text-center space-y-5 max-w-sm mx-auto w-full">
          {isActiveTeam && !isPsychic ? (
            <div className="space-y-5">
              <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                حرّك المؤشر مع فريقك!
              </h3>

              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
                <span className="text-6xl font-black text-emerald-400 font-mono block">
                  {localDial}%
                </span>

                {/* Range Slider in LTR matching the TV Gauge */}
                <div style={{ direction: 'ltr' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localDial}
                    onChange={(e) => handleDialChange(parseInt(e.target.value))}
                    className="w-full h-4 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1 font-bold">
                    <span className="text-blue-400">0% (يسار)</span>
                    <button
                      type="button"
                      onClick={() => handleDialChange(50)}
                      className="text-slate-400 hover:text-white underline text-[11px]"
                    >
                      50% (الوسط)
                    </button>
                    <span className="text-purple-400">100% (يمين)</span>
                  </div>
                </div>

                {/* Step nudges for mobile touch precision */}
                <div className="flex items-center justify-center gap-2 pt-1" style={{ direction: 'ltr' }}>
                  <button
                    onClick={() => adjustDial(-5)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl"
                  >
                    -5%
                  </button>
                  <button
                    onClick={() => adjustDial(-1)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl"
                  >
                    -1%
                  </button>
                  <button
                    onClick={() => adjustDial(+1)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl"
                  >
                    +1%
                  </button>
                  <button
                    onClick={() => adjustDial(+5)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl"
                  >
                    +5%
                  </button>
                </div>
              </div>

              <button
                onClick={handleLockIn}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-lg flex items-center justify-center gap-2 glow-emerald shadow-xl active:scale-95 transition-all"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <Lock className="w-5 h-5" />
                <span>تثبيت المؤشر (Lock In)</span>
              </button>
            </div>
          ) : isPsychic ? (
            <div className="py-8 space-y-3">
              <span className="text-5xl block animate-pulse">🤫</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                فريقك يتناقشون ويحركون المؤشر...
              </h3>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl inline-block text-emerald-400 text-xs font-bold">
                موقعك السري: {state.targetCenter}% — ممنوع إعطاء أي تلميح أو تعبير وجه!
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-3">
              <span className="text-5xl block">👀</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                راقب مؤشر {activeTeamName} على الشاشة...
              </h3>
              <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                استعد لفرصة السرقة فور تثبيتهم للمؤشر!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE 3: OPPONENT_STEAL (Accurate Physical Left / Right Buttons) ─ */}
      {state.subPhase === 'OPPONENT_STEAL' && (
        <div className="my-auto text-center space-y-4 max-w-sm mx-auto w-full">
          {isOpposingTeam ? (
            <div className="space-y-4">
              <span className="text-5xl block animate-bounce">🎯</span>
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                فرصة السرقة! (+1 نقطة)
              </h2>
              <div className="bg-slate-900/90 border border-violet-500/40 p-3 rounded-2xl">
                <span className="text-slate-300 text-xs block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  مؤشر الخصم الحالي مثبت عند:
                </span>
                <span className="text-2xl font-black text-white font-mono block">
                  {state.teamDialValue}%
                </span>
                <p className="text-violet-300 text-xs mt-1 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  هل الهدف الحقيقي يقع على يسار المؤشر أم على يمينه؟
                </p>
              </div>

              {hasVotedSteal ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 text-sm font-bold flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span style={{ fontFamily: 'Cairo, sans-serif' }}>تم تسجيل رهانك! بانتظار الكشف على الشاشة...</span>
                </div>
              ) : (
                /* Strict LTR Container: Physical Left button is on Left, Right button on Right */
                <div className="grid grid-cols-2 gap-3" style={{ direction: 'ltr' }}>
                  {/* Physical Left Button: targetCenter < teamDialValue */}
                  <button
                    onClick={() => handleOpponentPredict('LEFT')}
                    className="py-5 px-3 bg-gradient-to-b from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 border-2 border-blue-400/60 active:scale-95 text-white font-black rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-xl transition-all"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    <ArrowLeft className="w-7 h-7 text-blue-300" />
                    <span className="text-base">إلى اليسار</span>
                    <span className="text-[11px] text-blue-200 font-bold">
                      أقل من {state.teamDialValue}%
                    </span>
                    <span className="text-[10px] text-blue-300/80 font-normal">
                      (جهة {state.card.leftPole})
                    </span>
                  </button>

                  {/* Physical Right Button: targetCenter > teamDialValue */}
                  <button
                    onClick={() => handleOpponentPredict('RIGHT')}
                    className="py-5 px-3 bg-gradient-to-b from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 border-2 border-purple-400/60 active:scale-95 text-white font-black rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-xl transition-all"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    <ArrowRight className="w-7 h-7 text-purple-300" />
                    <span className="text-base">إلى اليمين</span>
                    <span className="text-[11px] text-purple-200 font-bold">
                      أكثر من {state.teamDialValue}%
                    </span>
                    <span className="text-[10px] text-purple-300/80 font-normal">
                      (جهة {state.card.rightPole})
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 space-y-3">
              <span className="text-5xl block animate-pulse">🤞</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                خصمكم يراهن الآن على سرقة النقطة...
              </h3>
              <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                راقبوا الشاشة الرئيسية لكشف الهدف والنتيجة!
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
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-sm space-y-2.5 shadow-xl">
            <div className="flex justify-between" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-slate-400">الهدف الحقيقي:</span>
              <span className="text-emerald-400 font-black font-mono">{state.targetCenter}%</span>
            </div>
            <div className="flex justify-between" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-slate-400">مؤشر {activeTeamName}:</span>
              <span className="text-white font-black font-mono">{state.teamDialValue}%</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-slate-400">نقاط {activeTeamName}:</span>
              <span className="text-emerald-400 font-black">+{state.lastRoundPoints.activeTeamEarned} نقاط</span>
            </div>
            {state.lastRoundPoints.opponentTeamEarned > 0 && (
              <div className="flex justify-between text-violet-400 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                <span>سرقة الخصم:</span>
                <span>+1 نقطة 🎯</span>
              </div>
            )}
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
