import { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Settings, Users, Copy, Check } from 'lucide-react';
import { usePartyStore } from '../../store/usePartyStore';
import { RoomState, GameId } from '../../types/game';

interface Props {
  room: RoomState;
}

const GAMES = [
  {
    id: 'TABOO' as GameId,
    emoji: '🤫',
    name: 'قول بس لا تقول',
    desc: 'فريق يوصف، فريق يخمن! ممنوع تقول الكلمات المحرّمة الخمسة',
    color: 'from-emerald-900 to-emerald-800 border-emerald-500/50',
  },
  {
    id: 'WAVELENGTH' as GameId,
    emoji: '📡',
    name: 'الطول الموجي',
    desc: 'البيشيك يعطي تلميح والفريق يحرّك المؤشر على النطاق الصح',
    color: 'from-cyan-900 to-cyan-800 border-cyan-500/50',
  },
  {
    id: 'FAMILY_FEUD' as GameId,
    emoji: '🎤',
    name: 'ستيف هارفي',
    desc: 'حرب العائلات! استطلاع 100 شخص - وش أكثر إجابة قالوها؟',
    color: 'from-amber-900 to-amber-800 border-amber-500/50',
  },
  {
    id: 'SPYFALL' as GameId,
    emoji: '🕵️',
    name: 'برّا السالفة',
    desc: 'في جاسوس بينكم! اكتشفوه قبل ما يكشف المكان السري للشلة',
    color: 'from-red-900 to-red-800 border-red-500/50',
  },
];

export default function HostLobby({ room }: Props) {
  const { emit, baseUrl, setBaseUrl, lanIp } = usePartyStore();
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              PartyHub 🎉
            </h1>
            <p className="text-slate-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
              اختر لعبة لتبدأ السهرة!
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center">
              <div className="text-slate-400 text-sm mb-3" style={{ fontFamily: 'Cairo, sans-serif' }}>
                كود الغرفة
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span
                  className="text-5xl font-black text-white tracking-widest"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  {room.code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              <div className="bg-white p-3 rounded-2xl inline-block shadow-lg">
                <QRCodeSVG value={qrUrl} size={160} />
              </div>
              <p className="text-slate-500 text-xs mt-3" style={{ fontFamily: 'Cairo, sans-serif' }}>
                امسح الكود بكاميرا الجوال
              </p>
              <div className="mt-4">
                <input
                  type="text"
                  value={baseUrl || `http://${lanIp}:5173`}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
                  style={{ direction: 'ltr' }}
                />
                <p className="text-slate-600 text-xs mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  رابط QR (عدّله لو الجوال ما يتصل)
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-white font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  اللاعبين ({connectedCount})
                </span>
              </div>
              {players.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  في انتظار انضمام اللاعبين بجوالاتهم...
                </p>
              ) : (
                <div className="space-y-2">
                  {players.map((p) => (
                    <div
                      key={p.deviceId}
                      className={`flex items-center gap-3 p-2 rounded-xl ${
                        p.isConnected ? 'bg-slate-800/50' : 'opacity-50'
                      }`}
                    >
                      <span className="text-2xl">{p.avatar}</span>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
                          {p.name}
                        </div>
                        <div
                          className={`text-xs ${p.team === 'A' ? 'text-emerald-400' : 'text-violet-400'}`}
                          style={{ fontFamily: 'Cairo, sans-serif' }}
                        >
                          {p.team === 'A' ? '🦅 الصقور' : '🐺 الذئاب'}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${p.isConnected ? 'bg-emerald-400' : 'bg-red-500'}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4"
              >
                <h3 className="text-white font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  الإعدادات
                </h3>
                <div>
                  <label className="text-slate-400 text-sm block mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    مدة الجولة (ثانية)
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-sm block mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    نقاط الفوز
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    وضع الشاشة الواحدة (تحكم مباشر)
                  </span>
                  <button
                    onClick={() =>
                      emit('host:update_settings', {
                        roomCode: room.code,
                        settings: { singleScreenMode: !room.settings.singleScreenMode },
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors ${
                      room.settings.singleScreenMode ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${
                        room.settings.singleScreenMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
              اختر اللعبة للبدء
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GAMES.map((game, i) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleGameSelect(game.id)}
                  className={`game-card bg-gradient-to-br ${game.color} border-2 rounded-3xl p-6 text-right hover:brightness-110 transition-all text-white`}
                >
                  <div className="text-5xl mb-3">{game.emoji}</div>
                  <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {game.name}
                  </h3>
                  <p className="text-slate-300 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {game.desc}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
