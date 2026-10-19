import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
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

  const [clueInput, setClueInput] = useState('');
  const [localDial, setLocalDial] = useState(state.teamDialValue);

  // Keep local slider synced with the server/other teammates in real time
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

  const myTeamName = room.teams[player.team]?.name || (player.team === 'A' ? 'فريق A' : 'فريق B');
  const activeTeamName = room.teams[state.activeTeam]?.name || (state.activeTeam === 'A' ? 'فريق A' : 'فريق B');

  // Mini-gauge calculation for Psychic secret view
  const targetAngle = (state.targetCenter / 100) * 180 - 90;

  return (
    <div className="h-dvh playful-bg flex flex-col justify-between p-4 select-none overflow-y-auto">
      {/* ─── TOP STATUS HEADER ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar}</span>
          <span className="text-xs font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {player.name}
          </span>
          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
              player.team === 'A' ? 'bg-emerald-500/25 text-emerald-300' : 'bg-purple-500/25 text-purple-300'
            }`}
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            {myTeamName}
          </span>
        </div>
        <div className="text-xs font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {isActiveTeam ? (
            <span className="text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-xl">دور فريقك يلعب 🦅</span>
          ) : (
            <span className="text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-xl">دور {activeTeamName} 🐺</span>
          )}
        </div>
      </div>

      {/* ─── SPECTRUM POLES SUMMARY (Pinned physical Left / Right) ────────── */}
      <div className="playful-card p-3.5 my-2 text-center text-xs shadow-xl">
        <div className="grid grid-cols-2 gap-2.5 font-bold mb-1" style={{ direction: 'ltr' }}>
          <div className="bg-sky-500/20 border border-sky-400/40 p-3 rounded-2xl text-left shadow-sm">
            <span className="text-[10px] text-sky-300 font-black block mb-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>
              ⬅️ القطب الأيسر (0%)
            </span>
            <span className="text-sm font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.card.leftPole}
            </span>
          </div>

          <div className="bg-purple-500/20 border border-purple-400/40 p-3 rounded-2xl text-right shadow-sm">
            <span className="text-[10px] text-purple-300 font-black block mb-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>
              القطب الأيمن (100%) ➡️
            </span>
            <span className="text-sm font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.card.rightPole}
            </span>
          </div>
        </div>

        {state.clueText && (
          <div
            className="mt-2 text-amber-300 font-black text-sm bg-amber-400/20 border border-amber-400/30 py-1.5 px-4 rounded-xl inline-block shadow-sm"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            التلميح: "{state.clueText}" ✨
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
              <div className="playful-card p-5 border-emerald-400/60 shadow-2xl space-y-3">
                <span className="text-xs text-white/70 font-bold block" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  موقع الهدف السري المطلوب:
                </span>
                <span className="text-5xl font-black text-emerald-300 font-mono block drop-shadow-md">
                  {state.targetCenter}%
                </span>

                {/* Psychic Mini-Gauge Preview */}
                <div className="relative w-full max-w-[240px] mx-auto aspect-[2/1] overflow-hidden flex items-end justify-center">
                  <div className="absolute inset-0 rounded-t-full bg-black/40 border-t-2 border-x-2 border-white/20" />
                  {/* Needle pointing to target */}
                  <div
                    className="absolute bottom-0 left-1/2 w-1.5 h-[85%] bg-emerald-400 origin-bottom -translate-x-1/2 rounded-t-full shadow-[0_0_12px_#34d399]"
                    style={{ transform: `translateX(-50%) rotate(${targetAngle}deg)` }}
                  />
                  {/* Pivot cap */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-slate-800 border-2 border-emerald-400" />
                </div>

                <div className="flex justify-between text-[11px] text-white/60 px-2 font-bold" style={{ direction: 'ltr', fontFamily: 'Cairo, sans-serif' }}>
                  <span className="text-sky-300">0% (يسار)</span>
                  <span className="text-emerald-300 font-black">الهدف: {state.targetCenter}%</span>
                  <span className="text-purple-300">100% (يمين)</span>
                </div>

                <p className="text-xs text-white/80 mt-2 font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  أعط تلميحاً ذكياً يناسب موقع {state.targetCenter}% بدقة بين القطبين!
                </p>
              </div>

              <form onSubmit={handleSubmitClue} className="space-y-3">
                <input
                  type="text"
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  placeholder="اكتب التلميح (أو قله بصوتك للمجلس)..."
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-white text-sm outline-none focus:border-amber-400 font-bold placeholder:text-white/40"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                />
                <button
                  type="submit"
                  className="btn-playful-peach w-full py-4 text-base flex items-center justify-center gap-2 cursor-pointer"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <Sparkles className="w-5 h-5 fill-white" />
                  <span>أرسل التلميح — ابدأ التخمين!</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="py-8 space-y-3 playful-card p-6">
              <Sparkles className="w-12 h-12 text-amber-300 mx-auto animate-pulse" />
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                البيشيك يجهز تلميحه السري...
              </h3>
              <p className="text-white/60 text-xs font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
                استمع جيداً لتلميح البيشيك فور نطقه! 🔮
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE 2: TEAM_GUESS ───────────────────────────────────────── */}
      {state.subPhase === 'TEAM_GUESS' && (
        <div className="my-auto text-center space-y-5 max-w-sm mx-auto w-full">
          {isActiveTeam && !isPsychic ? (
            <div className="space-y-4">
              <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                حرّك المؤشر مع فريقك! 🎯
              </h3>

              <div className="playful-card p-5 shadow-2xl space-y-4">
                <span className="text-6xl font-black text-amber-300 font-mono block drop-shadow-sm">
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
                    className="w-full h-4 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1 font-bold">
                    <span className="text-sky-300">0% (يسار)</span>
                    <button
                      type="button"
                      onClick={() => handleDialChange(50)}
                      className="text-white/70 hover:text-white underline text-[11px]"
                    >
                      50% (الوسط)
                    </button>
                    <span className="text-purple-300">100% (يمين)</span>
                  </div>
                </div>

                {/* Step nudges for mobile touch precision */}
                <div className="flex items-center justify-center gap-2 pt-1" style={{ direction: 'ltr' }}>
                  <button
                    onClick={() => adjustDial(-5)}
                    className="btn-playful-slate px-3.5 py-1.5 text-xs cursor-pointer"
                  >
                    -5%
                  </button>
                  <button
                    onClick={() => adjustDial(-1)}
                    className="btn-playful-slate px-3.5 py-1.5 text-xs cursor-pointer"
                  >
                    -1%
                  </button>
                  <button
                    onClick={() => adjustDial(+1)}
                    className="btn-playful-slate px-3.5 py-1.5 text-xs cursor-pointer"
                  >
                    +1%
                  </button>
                  <button
                    onClick={() => adjustDial(+5)}
                    className="btn-playful-slate px-3.5 py-1.5 text-xs cursor-pointer"
                  >
                    +5%
                  </button>
                </div>
              </div>

              <button
                onClick={handleLockIn}
                className="btn-playful-peach w-full py-4 text-lg flex items-center justify-center gap-2 cursor-pointer"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <Lock className="w-5 h-5" />
                <span>تثبيت المؤشر (Lock In)</span>
              </button>
            </div>
          ) : isPsychic ? (
            <div className="py-8 space-y-3 playful-card p-6">
              <span className="text-5xl block animate-pulse">🤫</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                فريقك يتناقشون ويحركون المؤشر...
              </h3>
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl inline-block text-emerald-300 text-xs font-black">
                موقعك السري: {state.targetCenter}% — ممنوع إعطاء أي تلميح أو تعبير وجه!
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-4 playful-card p-6">
              <span className="text-5xl block">👀</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                فريق {activeTeamName} يحركون المؤشر...
              </h3>
              <div className="p-4 bg-white/10 border border-white/15 rounded-2xl inline-block shadow-lg">
                <span className="text-xs text-white/60 block mb-1 font-bold">المؤشر الحالي:</span>
                <span className="text-4xl font-black text-amber-300 font-mono">{state.teamDialValue}%</span>
              </div>
              <p className="text-white/60 text-xs font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                راقب الشاشة لمعرفة أين سيثبتون مؤشرهم! 📺
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBPHASE 3: REVEAL ───────────────────────────────────────────── */}
      {state.subPhase === 'REVEAL' && (
        <div className="my-auto text-center space-y-5 max-w-sm mx-auto">
          <span className="text-6xl block animate-bounce">🎉</span>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            تم كشف الهدف!
          </h2>
          <div className="playful-card p-5 text-sm space-y-3 shadow-2xl">
            <div className="flex justify-between font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-white/70">الهدف الحقيقي:</span>
              <span className="text-emerald-300 font-black font-mono text-base">{state.targetCenter}%</span>
            </div>
            <div className="flex justify-between font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-white/70">مؤشر {activeTeamName}:</span>
              <span className="text-white font-black font-mono text-base">{state.teamDialValue}%</span>
            </div>
            <div className="flex justify-between border-t border-white/15 pt-2.5 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-white/70">نقاط {activeTeamName}:</span>
              <span className="text-amber-300 font-black text-lg">+{state.lastRoundPoints.activeTeamEarned} نقاط</span>
            </div>
          </div>
          <p className="text-amber-300 text-xs font-bold animate-pulse" style={{ fontFamily: 'Cairo, sans-serif' }}>
            بانتظار المضيف لبدء السؤال التالي... ⏳
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-1">
        <span className="text-[11px] text-white/40 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
          الطول الموجي — PartyHub 📡
        </span>
      </div>
    </div>
  );
}
