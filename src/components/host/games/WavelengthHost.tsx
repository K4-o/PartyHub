import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { RoomState, WavelengthState } from '../../../types/game';
import { usePartyStore } from '../../../store/usePartyStore';
import ScoreBanner from '../../shared/ScoreBanner';
import HostOverrideDrawer from '../../shared/HostOverrideDrawer';

interface Props {
  room: RoomState;
  state: WavelengthState;
}

export default function WavelengthHost({ room, state }: Props) {
  const { emit } = usePartyStore();
  const [localDial, setLocalDial] = useState(state.teamDialValue);

  const activeTeamState = room.teams[state.activeTeam];
  const opposingTeamId = state.activeTeam === 'A' ? 'B' : 'A';
  const opposingTeamState = room.teams[opposingTeamId];
  const psychicPlayer = room.players[state.psychicDeviceId];

  // Angle for the needle: 0% = -90deg (pointing left), 50% = 0deg (pointing up), 100% = +90deg (pointing right)
  const needleAngle = (state.teamDialValue / 100) * 180 - 90;
  const isRevealed = state.subPhase === 'REVEAL';

  const handleDialChange = (val: number) => {
    setLocalDial(val);
    emit('wavelength:move_dial', { roomCode: room.code, value: val });
  };

  const handleLockIn = () => {
    emit('wavelength:lock_in', { roomCode: room.code });
  };

  const handleOpponentPredict = (prediction: 'LEFT' | 'RIGHT') => {
    emit('wavelength:opponent_predict', { roomCode: room.code, prediction });
  };

  const handleForceReveal = () => {
    emit('wavelength:force_reveal', { roomCode: room.code });
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full pb-20">
      {/* ─── TOP: SCORE BANNER ────────────────────────────────────────────── */}
      <div className="mb-4">
        <ScoreBanner teams={room.teams} activeTeam={state.activeTeam} />
      </div>

      {/* ─── SPECTRUM POLES BANNER ────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 mb-6 text-center shadow-xl">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {state.card.category} — الجولة {state.roundNumber}
        </div>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="bg-blue-950/40 border border-blue-800/40 p-4 rounded-2xl text-right">
            <span className="text-xs text-blue-400 font-bold block mb-1">الطرف الأيمن (0%)</span>
            <span className="text-xl md:text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.card.leftPole}
            </span>
          </div>
          <div className="bg-purple-950/40 border border-purple-800/40 p-4 rounded-2xl text-left">
            <span className="text-xs text-purple-400 font-bold block mb-1">الطرف الأيسر (100%)</span>
            <span className="text-xl md:text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.card.rightPole}
            </span>
          </div>
        </div>

        {/* Psychic Clue Callout */}
        {state.clueText && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
              تلميح {psychicPlayer?.name || 'البيشيك'}:
            </span>
            <span className="text-lg font-black text-emerald-300" style={{ fontFamily: 'Cairo, sans-serif' }}>
              "{state.clueText}"
            </span>
          </motion.div>
        )}
      </div>

      {/* ─── WAVELENGTH 180° GAUGE ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center my-4">
        <div className="relative w-full max-w-xl aspect-[2/1] overflow-hidden flex items-end justify-center">
          {/* Half circle track */}
          <div className="absolute inset-0 rounded-t-full bg-slate-900 border-t-4 border-x-4 border-slate-700/80 shadow-[inset_0_15px_30px_rgba(0,0,0,0.6)]" />

          {/* Target Zone Wedges (Revealed when shutter is open or during reveal) */}
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 rounded-t-full overflow-hidden"
              >
                {/* 2 Pt Outer Ring: targetCenter ± 15 */}
                <div
                  className="absolute bottom-0 left-1/2 w-full h-full origin-bottom bg-cyan-500/30 -translate-x-1/2"
                  style={{
                    clipPath: `polygon(50% 100%, ${50 + 50 * Math.cos(((180 - (state.targetCenter - 15) * 1.8) * Math.PI) / 180)}% ${100 - 100 * Math.sin(((180 - (state.targetCenter - 15) * 1.8) * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((180 - (state.targetCenter + 15) * 1.8) * Math.PI) / 180)}% ${100 - 100 * Math.sin(((180 - (state.targetCenter + 15) * 1.8) * Math.PI) / 180)}%)`,
                  }}
                />
                {/* 3 Pt Inner Ring: targetCenter ± 9 */}
                <div
                  className="absolute bottom-0 left-1/2 w-full h-full origin-bottom bg-amber-500/50 -translate-x-1/2"
                  style={{
                    clipPath: `polygon(50% 100%, ${50 + 50 * Math.cos(((180 - (state.targetCenter - 9) * 1.8) * Math.PI) / 180)}% ${100 - 100 * Math.sin(((180 - (state.targetCenter - 9) * 1.8) * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((180 - (state.targetCenter + 9) * 1.8) * Math.PI) / 180)}% ${100 - 100 * Math.sin(((180 - (state.targetCenter + 9) * 1.8) * Math.PI) / 180)}%)`,
                  }}
                />
                {/* 4 Pt Bullseye: targetCenter ± 3 */}
                <div
                  className="absolute bottom-0 left-1/2 w-full h-full origin-bottom bg-emerald-500/80 -translate-x-1/2"
                  style={{
                    clipPath: `polygon(50% 100%, ${50 + 50 * Math.cos(((180 - (state.targetCenter - 3) * 1.8) * Math.PI) / 180)}% ${100 - 100 * Math.sin(((180 - (state.targetCenter - 3) * 1.8) * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((180 - (state.targetCenter + 3) * 1.8) * Math.PI) / 180)}% ${100 - 100 * Math.sin(((180 - (state.targetCenter + 3) * 1.8) * Math.PI) / 180)}%)`,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Needle */}
          <motion.div
            className="absolute bottom-0 left-1/2 w-2 h-[90%] bg-gradient-to-t from-red-600 to-red-400 origin-bottom -translate-x-1/2 rounded-t-full shadow-[0_0_15px_rgba(239,68,68,0.8)] z-20"
            style={{
              transform: `translateX(-50%) rotate(${needleAngle}deg)`,
              transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="w-5 h-5 bg-white rounded-full -translate-x-1.5 -translate-y-2 border-2 border-red-500 shadow-lg" />
          </motion.div>

          {/* Pivot center cap */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-600 shadow-2xl z-30 flex items-center justify-center">
            <span className="text-xs font-black text-white">{state.teamDialValue}%</span>
          </div>

          {/* Shutter Cover (Animated open during REVEAL) */}
          <AnimatePresence>
            {!isRevealed && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 rounded-t-full bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center z-10 border-t-2 border-slate-700"
              >
                <Lock className="w-8 h-8 text-slate-500 mb-2 animate-pulse" />
                <span className="text-sm font-bold text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {state.subPhase === 'PSYCHIC_CLUE' && 'البيشيك يكتب التلميح بجواله...'}
                  {state.subPhase === 'TEAM_GUESS' && 'الفريق يحرك المؤشر الآن!'}
                  {state.subPhase === 'OPPONENT_STEAL' && `تصويت ${opposingTeamState.name} على السرقة...`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phase Indicator & Points Reveal */}
        <div className="mt-8 text-center">
          {state.subPhase === 'PSYCHIC_CLUE' && (
            <div className="text-slate-400 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
              دور البيشيك <span className="text-white font-bold">{psychicPlayer?.name}</span> في إرسال التلميح.
            </div>
          )}

          {state.subPhase === 'TEAM_GUESS' && (
            <div className="text-emerald-400 text-sm font-bold animate-pulse" style={{ fontFamily: 'Cairo, sans-serif' }}>
              تناقشوا وحركوا المؤشر بجوالاتكم ثم اضغطوا تثبيت!
            </div>
          )}

          {state.subPhase === 'OPPONENT_STEAL' && (
            <div className="text-violet-400 text-sm font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              فرصة {opposingTeamState.name}: هل الهدف الحقيقي يمين أم يسار المؤشر؟
            </div>
          )}

          {state.subPhase === 'REVEAL' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900/90 border border-slate-700 px-6 py-4 rounded-2xl shadow-2xl inline-block"
            >
              <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                حصل {activeTeamState.name} على{' '}
                <span className="text-emerald-400">+{state.lastRoundPoints.activeTeamEarned} نقاط</span>
              </div>
              {state.lastRoundPoints.opponentTeamEarned > 0 && (
                <div className="text-sm font-bold text-violet-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  سرق {opposingTeamState.name} +1 نقطة!
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM: HOST OVERRIDE DRAWER (DIRECT CONTROLS) ──────────────── */}
      <HostOverrideDrawer title="تحكم المضيف المباشر في المؤشر">
        <div className="space-y-4 max-w-lg mx-auto">
          {/* Dial slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span>0% (أقصى اليمين)</span>
              <span className="text-white font-bold">{localDial}%</span>
              <span>100% (أقصى اليسار)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localDial}
              onChange={(e) => handleDialChange(parseInt(e.target.value))}
              disabled={state.subPhase === 'REVEAL'}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleLockIn}
              disabled={state.subPhase !== 'TEAM_GUESS'}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 disabled:opacity-40 transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <Lock className="w-4 h-4" />
              <span>تثبيت المؤشر</span>
            </button>

            <button
              onClick={() => handleOpponentPredict('LEFT')}
              disabled={state.subPhase !== 'OPPONENT_STEAL'}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 disabled:opacity-40 transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>الخصم يراهن: يسار</span>
            </button>

            <button
              onClick={() => handleOpponentPredict('RIGHT')}
              disabled={state.subPhase !== 'OPPONENT_STEAL'}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 disabled:opacity-40 transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <span>الخصم يراهن: يمين</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleForceReveal}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-sm flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <Eye className="w-4 h-4" />
              <span>كشف النتيجة</span>
            </button>
          </div>
        </div>
      </HostOverrideDrawer>
    </div>
  );
}
