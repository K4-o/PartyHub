import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, ArrowLeft, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { RoomState, WavelengthState } from '../../../types/game';
import { usePartyStore } from '../../../store/usePartyStore';
import ScoreBanner from '../../shared/ScoreBanner';
import HostOverrideDrawer from '../../shared/HostOverrideDrawer';

interface Props {
  room: RoomState;
  state: WavelengthState;
}

/**
 * Generates an SVG path for an annular wedge (pie slice between rIn and rOut)
 * from percentage p1 to p2 on a 180° semicircle.
 * 0% is physical LEFT (angle PI), 100% is physical RIGHT (angle 0).
 */
function describeArcWedge(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  p1: number,
  p2: number
): string {
  const startP = Math.max(0, Math.min(100, Math.min(p1, p2)));
  const endP = Math.max(0, Math.min(100, Math.max(p1, p2)));
  if (startP === endP) return '';

  const a1 = (startP * Math.PI) / 100;
  const a2 = (endP * Math.PI) / 100;

  const x1Out = cx - rOut * Math.cos(a1);
  const y1Out = cy - rOut * Math.sin(a1);
  const x2Out = cx - rOut * Math.cos(a2);
  const y2Out = cy - rOut * Math.sin(a2);

  const x2In = cx - rIn * Math.cos(a2);
  const y2In = cy - rIn * Math.sin(a2);
  const x1In = cx - rIn * Math.cos(a1);
  const y1In = cy - rIn * Math.sin(a1);

  const largeArc = endP - startP > 50 ? 1 : 0;

  return [
    `M ${x1In.toFixed(2)} ${y1In.toFixed(2)}`,
    `L ${x1Out.toFixed(2)} ${y1Out.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2Out.toFixed(2)} ${y2Out.toFixed(2)}`,
    `L ${x2In.toFixed(2)} ${y2In.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1In.toFixed(2)} ${y1In.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export default function WavelengthHost({ room, state }: Props) {
  const { emit } = usePartyStore();
  const [localDial, setLocalDial] = useState(state.teamDialValue);

  const activeTeamState = room.teams[state.activeTeam];
  const opposingTeamId = state.activeTeam === 'A' ? 'B' : 'A';
  const opposingTeamState = room.teams[opposingTeamId];
  const psychicPlayer = room.players[state.psychicDeviceId];

  // Needle angle: 0% = -90deg (pointing LEFT), 50% = 0deg (pointing UP), 100% = +90deg (pointing RIGHT)
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

  // SVG Gauge constants
  const cx = 280;
  const cy = 270;
  const rOuter = 240;
  const rInner = 110;
  const rMid = (rOuter + rInner) / 2;

  // Mechanical ticks along semicircle rim
  const ticks = useMemo(() => {
    const list = [];
    for (let p = 0; p <= 100; p += 2) {
      const a = (p * Math.PI) / 100;
      const isMajor = p % 10 === 0;
      const r1 = isMajor ? rOuter + 6 : rOuter + 1;
      const r2 = rOuter - (isMajor ? 12 : 6);
      const x1 = cx - r1 * Math.cos(a);
      const y1 = cy - r1 * Math.sin(a);
      const x2 = cx - r2 * Math.cos(a);
      const y2 = cy - r2 * Math.sin(a);

      let textCoords = null;
      if (isMajor) {
        const rT = rOuter + 18;
        textCoords = {
          x: cx - rT * Math.cos(a),
          y: cy - rT * Math.sin(a),
          val: p,
        };
      }

      list.push({ p, x1, y1, x2, y2, isMajor, textCoords });
    }
    return list;
  }, [cx, cy, rOuter]);

  // Target wedge paths
  const T = state.targetCenter;
  const bullseyePath = describeArcWedge(cx, cy, rInner, rOuter - 4, T - 3, T + 3);
  const innerRingPath = describeArcWedge(cx, cy, rInner, rOuter - 4, T - 9, T + 9);
  const outerRingPath = describeArcWedge(cx, cy, rInner, rOuter - 4, T - 15, T + 15);

  // Label coordinates for point values inside wedges
  const getPointLabelCoord = (p: number) => {
    const a = (p * Math.PI) / 100;
    return {
      x: cx - rMid * Math.cos(a),
      y: cy - rMid * Math.sin(a),
    };
  };

  const p4Coord = getPointLabelCoord(T);
  const p3LeftCoord = getPointLabelCoord(T - 6);
  const p3RightCoord = getPointLabelCoord(T + 6);
  const p2LeftCoord = getPointLabelCoord(T - 12);
  const p2RightCoord = getPointLabelCoord(T + 12);

  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full pb-20">
      {/* ─── TOP: SCORE BANNER ────────────────────────────────────────────── */}
      <div className="mb-4">
        <ScoreBanner teams={room.teams} activeTeam={state.activeTeam} />
      </div>

      {/* ─── SPECTRUM POLES BANNER (Enforced dir="ltr" so Left Pole is physically Left, Right Pole is Right) ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 mb-4 text-center shadow-2xl">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {state.card.category} — الجولة {state.roundNumber} من {state.maxRounds * 2}
        </div>

        <div className="grid grid-cols-2 gap-4 items-stretch" style={{ direction: 'ltr' }}>
          {/* Physical Left Pole (0%) */}
          <div className="bg-blue-950/40 border-2 border-blue-600/40 p-4 rounded-2xl flex flex-col justify-between text-left">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs mb-1">
              <span>⬅️</span>
              <span style={{ fontFamily: 'Cairo, sans-serif' }}>القطب الأيسر (0%)</span>
            </div>
            <span className="text-xl md:text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {state.card.leftPole}
            </span>
          </div>

          {/* Physical Right Pole (100%) */}
          <div className="bg-purple-950/40 border-2 border-purple-600/40 p-4 rounded-2xl flex flex-col justify-between text-right">
            <div className="flex items-center justify-end gap-1.5 text-purple-400 font-bold text-xs mb-1">
              <span style={{ fontFamily: 'Cairo, sans-serif' }}>القطب الأيمن (100%)</span>
              <span>➡️</span>
            </div>
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
            <span className="text-xl font-black text-emerald-300" style={{ fontFamily: 'Cairo, sans-serif' }}>
              "{state.clueText}"
            </span>
          </motion.div>
        )}
      </div>

      {/* ─── HIGH-PRECISION SVG WAVELENGTH GAUGE ───────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        <div className="relative w-full max-w-2xl flex items-center justify-center">
          <svg
            viewBox="0 0 560 310"
            className="w-full h-auto drop-shadow-2xl overflow-visible select-none"
            style={{ direction: 'ltr' }}
          >
            <defs>
              {/* Radial gradient for the background dial face */}
              <radialGradient id="dialFaceGrad" cx="50%" cy="100%" r="90%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="70%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              {/* Shutter metallic cover gradient */}
              <linearGradient id="shutterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Needle gradient */}
              <linearGradient id="needleGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#b91c1c" />
                <stop offset="60%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#fca5a5" />
              </linearGradient>

              {/* Glow filter for bullseye */}
              <filter id="bullseyeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Semicircular outer bezel shadow */}
            <path
              d={`M ${cx - rOuter - 8} ${cy} A ${rOuter + 8} ${rOuter + 8} 0 0 1 ${cx + rOuter + 8} ${cy} Z`}
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="3"
            />

            {/* Semicircular dial face background */}
            <path
              d={describeArcWedge(cx, cy, rInner, rOuter, 0, 100)}
              fill="url(#dialFaceGrad)"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Minor and major mechanical ticks along rim */}
            {ticks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isMajor ? '#94a3b8' : '#334155'}
                  strokeWidth={t.isMajor ? 2.5 : 1}
                />
                {t.textCoords && (
                  <text
                    x={t.textCoords.x}
                    y={t.textCoords.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#64748b"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {t.textCoords.val}
                  </text>
                )}
              </g>
            ))}

            {/* TARGET WEDGES (Revealed only when isRevealed is TRUE) */}
            {isRevealed && (
              <g className="transition-opacity duration-700">
                {/* 2 Points: Outer Ring (Cyan) */}
                <path
                  d={outerRingPath}
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  opacity="0.9"
                />
                {/* 3 Points: Inner Ring (Amber Gold) */}
                <path
                  d={innerRingPath}
                  fill="#f59e0b"
                  stroke="#fde68a"
                  strokeWidth="1.5"
                  opacity="0.95"
                />
                {/* 4 Points: Bullseye (Glowing Emerald) */}
                <path
                  d={bullseyePath}
                  fill="#10b981"
                  stroke="#6ee7b7"
                  strokeWidth="2.5"
                  filter="url(#bullseyeGlow)"
                />

                {/* Score Number Labels */}
                <text
                  x={p4Coord.x}
                  y={p4Coord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="16"
                  fontWeight="900"
                >
                  4
                </text>
                <text
                  x={p3LeftCoord.x}
                  y={p3LeftCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="13"
                  fontWeight="800"
                >
                  3
                </text>
                <text
                  x={p3RightCoord.x}
                  y={p3RightCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="13"
                  fontWeight="800"
                >
                  3
                </text>
                <text
                  x={p2LeftCoord.x}
                  y={p2LeftCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="700"
                >
                  2
                </text>
                <text
                  x={p2RightCoord.x}
                  y={p2RightCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="700"
                >
                  2
                </text>
              </g>
            )}

            {/* MECHANICAL SHUTTER COVER (Visible when target is hidden) */}
            {!isRevealed && (
              <g>
                <path
                  d={describeArcWedge(cx, cy, rInner + 2, rOuter - 2, 0, 100)}
                  fill="url(#shutterGrad)"
                  stroke="#475569"
                  strokeWidth="1.5"
                  opacity="0.9"
                />
                {/* Shutter grooves for metallic authentic look */}
                {[20, 40, 60, 80].map((gp) => {
                  const ga = (gp * Math.PI) / 100;
                  return (
                    <line
                      key={gp}
                      x1={cx - (rInner + 6) * Math.cos(ga)}
                      y1={cy - (rInner + 6) * Math.sin(ga)}
                      x2={cx - (rOuter - 6) * Math.cos(ga)}
                      y2={cy - (rOuter - 6) * Math.sin(ga)}
                      stroke="#1e293b"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            )}

            {/* THE NEEDLE (Smooth rotation around (cx, cy)) */}
            <g
              transform={`rotate(${needleAngle} ${cx} ${cy})`}
              style={{ transition: 'transform 0.18s cubic-bezier(0.34, 1.3, 0.64, 1)' }}
            >
              {/* Needle Body */}
              <polygon
                points={`${cx - 7},${cy} ${cx + 7},${cy} ${cx + 1.5},${cy - rOuter + 8} ${cx - 1.5},${cy - rOuter + 8}`}
                fill="url(#needleGrad)"
                stroke="#ef4444"
                strokeWidth="1"
              />
              {/* Pointer Tip */}
              <polygon
                points={`${cx - 5},${cy - rOuter + 10} ${cx + 5},${cy - rOuter + 10} ${cx},${cy - rOuter - 8}`}
                fill="#ffffff"
                stroke="#ef4444"
                strokeWidth="1.5"
              />
              {/* Center spine highlight */}
              <line
                x1={cx}
                y1={cy - 20}
                x2={cx}
                y2={cy - rOuter + 8}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.5"
              />
            </g>

            {/* CENTRAL PIVOT HUB WITH DIGITAL VALUE */}
            <circle cx={cx} cy={cy} r="48" fill="#0f172a" stroke="#334155" strokeWidth="4" />
            <circle cx={cx} cy={cy} r="38" fill="#1e293b" stroke="#059669" strokeWidth="2.5" />
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#34d399"
              fontSize="18"
              fontWeight="900"
              fontFamily="monospace"
            >
              {state.teamDialValue}%
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#94a3b8"
              fontSize="9"
              fontWeight="bold"
            >
              المؤشر
            </text>
          </svg>
        </div>

        {/* Phase Indicator & Guidance */}
        <div className="mt-4 text-center min-h-[48px]">
          {state.subPhase === 'PSYCHIC_CLUE' && (
            <div className="text-slate-400 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
              دور البيشيك <span className="text-white font-bold">{psychicPlayer?.name}</span> في إرسال التلميح السري.
            </div>
          )}

          {state.subPhase === 'TEAM_GUESS' && (
            <div className="text-emerald-400 text-base font-bold animate-pulse" style={{ fontFamily: 'Cairo, sans-serif' }}>
              تناقشوا وحركوا المؤشر بجوالاتكم، ثم اضغطوا تثبيت المؤشر!
            </div>
          )}

          {state.subPhase === 'OPPONENT_STEAL' && (
            <div className="bg-violet-950/60 border border-violet-500/50 px-6 py-2.5 rounded-2xl inline-block shadow-lg">
              <span className="text-violet-300 text-sm font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>
                فرصة سرقة لـ {opposingTeamState.name}: هل الهدف الحقيقي يمين أم يسار المؤشر الحالي ({state.teamDialValue}%)؟
              </span>
            </div>
          )}

          {state.subPhase === 'REVEAL' && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900/90 border border-slate-700 px-6 py-3 rounded-2xl shadow-2xl inline-block"
            >
              <div className="text-xl md:text-2xl font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                حصل {activeTeamState.name} على{' '}
                <span className="text-emerald-400">+{state.lastRoundPoints.activeTeamEarned} نقاط</span>
              </div>
              {state.lastRoundPoints.opponentTeamEarned > 0 ? (
                <div className="text-sm font-bold text-violet-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  🎯 نجح {opposingTeamState.name} في سرقة +1 نقطة!
                </div>
              ) : (
                <div className="text-xs text-slate-500" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  لم يحصل الخصم على نقطة السرقة
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM: HOST DIRECT CONTROLS DRAWER ───────────────────────────── */}
      <HostOverrideDrawer title="تحكم المضيف المباشر في المؤشر">
        <div className="space-y-4 max-w-lg mx-auto">
          {/* Dial slider with physical LTR matching gauge */}
          <div style={{ direction: 'ltr' }}>
            <div className="flex justify-between text-xs text-slate-400 mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-blue-400">⬅️ 0% (أقصى اليسار)</span>
              <span className="text-white font-bold text-sm">{localDial}%</span>
              <span className="text-purple-400">100% (أقصى اليمين) ➡️</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localDial}
              onChange={(e) => handleDialChange(parseInt(e.target.value))}
              disabled={state.subPhase === 'REVEAL'}
              className="w-full accent-emerald-500 cursor-pointer h-3 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleLockIn}
              disabled={state.subPhase !== 'TEAM_GUESS'}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 disabled:opacity-40 transition-colors shadow-lg"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <Lock className="w-4 h-4" />
              <span>تثبيت المؤشر</span>
            </button>

            {/* Steal Left Button (Physically on Left in LTR layout) */}
            <div className="flex items-center gap-2" style={{ direction: 'ltr' }}>
              <button
                onClick={() => handleOpponentPredict('LEFT')}
                disabled={state.subPhase !== 'OPPONENT_STEAL'}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-lg"
                style={{ fontFamily: 'Cairo, sans-serif' }}
                title="الهدف أقل من قيمة المؤشر (جهة اليسار)"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>الخصم: يسار (&lt; {state.teamDialValue}%)</span>
              </button>

              <button
                onClick={() => handleOpponentPredict('RIGHT')}
                disabled={state.subPhase !== 'OPPONENT_STEAL'}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-lg"
                style={{ fontFamily: 'Cairo, sans-serif' }}
                title="الهدف أكثر من قيمة المؤشر (جهة اليمين)"
              >
                <span>الخصم: يمين (&gt; {state.teamDialValue}%)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleForceReveal}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-sm flex items-center gap-1.5 transition-colors shadow-lg"
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
