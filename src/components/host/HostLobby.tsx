import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Settings,
  Users,
  Copy,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRightLeft,
  Shield,
  Layers,
} from 'lucide-react';
import { usePartyStore } from '../../store/usePartyStore';
import { RoomState, GameId } from '../../types/game';

interface Props {
  room: RoomState;
}

const GAMES = [
  {
    id: 'TABOO' as GameId,
    image: '/assets/games/taboo.png',
    fallbackEmoji: '🤫',
    name: 'قول بس لا تقول',
    desc: 'فريق يوصف وفريق يخمن بدون نطق الكلمات الممنوعة الخمسة!',
    badge: 'حماس وسرعة بديهة',
    color: 'from-emerald-950 via-slate-900 to-emerald-950/60 border-emerald-500/40 hover:border-emerald-400',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'WAVELENGTH' as GameId,
    image: '/assets/games/wavelength.png',
    fallbackEmoji: '📡',
    name: 'الطول الموجي',
    desc: 'البيشيك يعطي تلميح والفريق يحرّك المؤشر على النطاق الصح!',
    badge: 'تخاطر وتفكير مشترك',
    color: 'from-cyan-950 via-slate-900 to-cyan-950/60 border-cyan-500/40 hover:border-cyan-400',
    tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'FAMILY_FEUD' as GameId,
    image: '/assets/games/familyfeud.png',
    fallbackEmoji: '🎤',
    name: 'ستيف هارفي',
    desc: 'حرب العائلات! استطلاع رأي 100 شخص - وش أكثر إجابة قالوها؟',
    badge: 'أجراس وتنافس عائلي',
    color: 'from-amber-950 via-slate-900 to-amber-950/60 border-amber-500/40 hover:border-amber-400',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'SPYFALL' as GameId,
    image: '/assets/games/spyfall.svg',
    fallbackEmoji: '🕵️',
    name: 'برّا السالفة',
    desc: 'في جاسوس بينكم ما يدري وين المكان! اكتشفوه قبل ما يكشفكم!',
    badge: 'ذكاء وخداع اجتماعي',
    color: 'from-indigo-950 via-slate-900 to-rose-950/60 border-rose-500/40 hover:border-rose-400',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
];

export default function HostLobby({ room }: Props) {
  const { emit, baseUrl, setBaseUrl, lanIp, updateTeamNames, movePlayerTeam, kickPlayer } = usePartyStore();
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingTeams, setIsEditingTeams] = useState(false);
  const [teamAName, setTeamAName] = useState(room.teams.A.name);
  const [teamBName, setTeamBName] = useState(room.teams.B.name);

  const qrUrl = `${baseUrl || `http://${lanIp}:5173`}/play?room=${room.code}`;
  const players = Object.values(room.players);
  const connectedCount = players.filter((p) => p.isConnected).length;

  const handleGameSelect = (gameId: GameId) => {
    emit('host:select_game', { roomCode: room.code, gameId });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTeams = () => {
    updateTeamNames(teamAName, teamBName);
    setIsEditingTeams(false);
  };

  return (
    <div className="min-h-screen playful-bg p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* ─── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-emerald-400">Party</span>Hub
              <span className="text-2xl">🎉</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>
              ألعاب السهرة والمجلس — اختر لعبة وابدأ التحدي!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingTeams(!isEditingTeams)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>إدارة الفرق</span>
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors text-slate-300"
              title="الإعدادات"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── TEAM EDIT DRAWER (IF OPEN) ──────────────────────────────────── */}
        <AnimatePresence>
          {isEditingTeams && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-slate-900/90 border border-slate-700 rounded-3xl p-5 mb-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    تعديل أسماء وتشكيلة الفرق
                  </h3>
                </div>
                <button
                  onClick={handleSaveTeams}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  حفظ التعديلات
                </button>
              </div>

              {/* Team Name Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-950/70 border border-emerald-500/40 p-3 rounded-2xl">
                  <label className="text-xs font-bold text-emerald-400 block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    اسم الفريق الأول (A):
                  </label>
                  <input
                    type="text"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none focus:border-emerald-500"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  />
                </div>

                <div className="bg-slate-950/70 border border-violet-500/40 p-3 rounded-2xl">
                  <label className="text-xs font-bold text-violet-400 block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    اسم الفريق الثاني (B):
                  </label>
                  <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none focus:border-violet-500"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── MAIN GRID: QR / PLAYERS / GAMES ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4 cols on lg): QR Code & Room Code */}
          <div className="lg:col-span-4 space-y-5">
            {/* Room Code & QR Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
              <span className="text-slate-400 text-xs font-bold block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                كود الغرفة للانضمام
              </span>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span
                  className="text-5xl font-black text-white tracking-widest text-glow-emerald"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  {room.code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  title="نسخ الكود"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>

              <div className="bg-white p-3.5 rounded-2xl inline-block shadow-2xl">
                <QRCodeSVG value={qrUrl} size={170} />
              </div>
              <p className="text-slate-400 text-xs mt-3 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                امسح الكود بكاميرا الجوال للدخول فوراً 📱
              </p>

              {/* Editable Base URL fallback */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-right">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span style={{ fontFamily: 'Cairo, sans-serif' }}>رابط الباركود (QR):</span>
                </div>
                <input
                  type="text"
                  value={baseUrl || `http://${lanIp}:5173`}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 text-left font-mono"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            {/* Players Control List */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-bold text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    اللاعبين المتصلين ({connectedCount})
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  تحكم المضيف
                </span>
              </div>

              {players.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="text-4xl mb-2 animate-bounce">📱</div>
                  <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    بانتظار مسح اللاعبين لكود الـ QR...
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {players.map((p) => (
                    <div
                      key={p.deviceId}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        p.isConnected
                          ? 'bg-slate-950/80 border-slate-800'
                          : 'bg-slate-950/40 border-slate-900 opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{p.avatar}</span>
                        <div>
                          <div className="text-white text-xs font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                            {p.name}
                          </div>
                          <span
                            className={`text-[10px] font-bold ${
                              p.team === 'A' ? 'text-emerald-400' : 'text-violet-400'
                            }`}
                            style={{ fontFamily: 'Cairo, sans-serif' }}
                          >
                            {p.team === 'A' ? `🦅 ${room.teams.A.name}` : `🐺 ${room.teams.B.name}`}
                          </span>
                        </div>
                      </div>

                      {/* Team Switcher Buttons for Host */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePlayerTeam(p.deviceId, 'A')}
                          title={`نقل إلى ${room.teams.A.name}`}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            p.team === 'A'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                          }`}
                          style={{ fontFamily: 'Cairo, sans-serif' }}
                        >
                          🦅 A
                        </button>
                        <button
                          onClick={() => movePlayerTeam(p.deviceId, 'B')}
                          title={`نقل إلى ${room.teams.B.name}`}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            p.team === 'B'
                              ? 'bg-violet-500 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-violet-400'
                          }`}
                          style={{ fontFamily: 'Cairo, sans-serif' }}
                        >
                          🐺 B
                        </button>
                        <button
                          onClick={() => kickPlayer(p.deviceId)}
                          title="طرد اللاعب"
                          className="p-1 hover:bg-red-950/60 text-slate-600 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Modal (If toggled) */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl"
              >
                <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  إعدادات الجولات
                </h3>
                <div>
                  <label className="text-slate-400 text-xs block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    مدة الجولة (ثانية):
                  </label>
                  <input
                    type="number"
                    defaultValue={room.settings.roundDurationSeconds}
                    onChange={(e) =>
                      emit('host:update_settings', {
                        roomCode: room.code,
                        settings: { roundDurationSeconds: parseInt(e.target.value) || 60 },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    نقاط الفوز النهائية:
                  </label>
                  <input
                    type="number"
                    defaultValue={room.settings.targetWinScore}
                    onChange={(e) =>
                      emit('host:update_settings', {
                        roomCode: room.code,
                        settings: { targetWinScore: parseInt(e.target.value) || 15 },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-300 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    وضع الشاشة الواحدة (تحكم المضيف المباشر):
                  </span>
                  <button
                    onClick={() =>
                      emit('host:update_settings', {
                        roomCode: room.code,
                        settings: { singleScreenMode: !room.settings.singleScreenMode },
                      })
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      room.settings.singleScreenMode ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                        room.settings.singleScreenMode ? 'left-1' : 'right-1'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column (8 cols on lg): Game Selection Grid */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>اختر اللعبة لتبدأ السهرة:</span>
              </h2>
              <span className="text-xs text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                4 ألعاب جاهزة بالكامل 🎮
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {GAMES.map((game, i) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.02, translateY: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGameSelect(game.id)}
                  className="playful-card p-5 text-right transition-all text-white group cursor-pointer shadow-2xl relative overflow-hidden flex flex-col justify-between hover:border-white/40"
                >
                  {/* Top section: Illustrated thumbnail + Badge */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 shadow-md">
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${game.tagColor}`}
                          style={{ fontFamily: 'Cairo, sans-serif' }}
                        >
                          {game.badge}
                        </span>
                        <span className="text-xl">{game.fallbackEmoji}</span>
                      </div>

                      <h3
                        className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors"
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                      >
                        {game.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed mb-3" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {game.desc}
                  </p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-bold group-hover:underline flex items-center gap-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      <span>بدء اللعبة والشرح</span>
                      <span>←</span>
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100" />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Teams Preview Banner under Games */}
            <div className="mt-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 flex items-center justify-around text-center">
              <div>
                <span className="text-xs text-slate-500 block" style={{ fontFamily: 'Cairo, sans-serif' }}>الفريق الأول</span>
                <span className="text-lg font-black text-emerald-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  🦅 {room.teams.A.name}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  ({players.filter((p) => p.team === 'A').length} لاعبين)
                </span>
              </div>
              <div className="text-slate-600 font-black text-lg">VS</div>
              <div>
                <span className="text-xs text-slate-500 block" style={{ fontFamily: 'Cairo, sans-serif' }}>الفريق الثاني</span>
                <span className="text-lg font-black text-violet-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  🐺 {room.teams.B.name}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  ({players.filter((p) => p.team === 'B').length} لاعبين)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
