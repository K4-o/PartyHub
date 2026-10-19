import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Sparkles } from 'lucide-react';
import { usePartyStore } from '../../store/usePartyStore';
import { haptics } from '../../utils/haptics';

const AVATARS = ['🦁', '🦅', '🦊', '🐯', '🥷', '🤖', '👑', '🐺', '🚀', '🔥', '💎', '⚡'];

interface Props {
  onJoined: () => void;
}

export default function ControllerJoin({ onJoined }: Props) {
  const [searchParams] = useSearchParams();
  const { joinRoom, playerName, playerAvatar, roomCode } = usePartyStore();

  const [code, setCode] = useState(searchParams.get('room') || roomCode || '');
  const [name, setName] = useState(playerName || '');
  const [avatar, setAvatar] = useState(playerAvatar || '🦁');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlCode = searchParams.get('room');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('يرجى إدخال كود الغرفة واسمك');
      return;
    }

    setIsLoading(true);
    setError('');
    haptics.medium();

    const res = await joinRoom(code.trim().toUpperCase(), name.trim(), avatar);
    setIsLoading(false);

    if (res.success) {
      haptics.light();
      onJoined();
    } else {
      setError(res.error || 'فشل الانضمام للغرفة');
      haptics.heavy();
    }
  };

  return (
    <div className="h-dvh bg-slate-950 flex flex-col justify-between p-6 select-none overflow-y-auto">
      {/* Header */}
      <div className="text-center pt-4">
        <span className="text-5xl mb-2 block">📱</span>
        <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
          انضمام للسهرة
        </h1>
        <p className="text-slate-400 text-sm mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
          ادخل بياناتك وانضم للشلة في ثواني
        </p>
      </div>

      {/* Join Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full my-auto">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-xs text-center font-bold"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            {error}
          </motion.div>
        )}

        {/* Room Code */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
            كود الغرفة (4 أحرف)
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            placeholder="مثال: KSA9"
            className="w-full text-center text-3xl font-black tracking-widest bg-slate-900 border-2 border-slate-800 focus:border-emerald-500 rounded-2xl py-3 text-white uppercase placeholder:text-slate-700 outline-none transition-colors"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          />
        </div>

        {/* Player Name */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
            اسمك المستعار
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
              placeholder="اكتب اسمك هنا..."
              className="w-full bg-slate-900 border-2 border-slate-800 focus:border-emerald-500 rounded-2xl px-4 py-3 text-white text-base outline-none transition-colors"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            />
            <User className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
          </div>
        </div>

        {/* Avatar Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            اختر صورتك الرمزية:
          </label>
          <div className="grid grid-cols-6 gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            {AVATARS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => {
                  setAvatar(emoji);
                  haptics.light();
                }}
                className={`text-2xl p-2 rounded-xl transition-transform ${
                  avatar === emoji ? 'bg-emerald-500/20 scale-110 border border-emerald-400 shadow-md' : 'hover:scale-105'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-2xl text-lg flex items-center justify-center gap-2 glow-emerald transition-all disabled:opacity-50 shadow-xl mt-4"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          {isLoading ? (
            <span>جاري الدخول...</span>
          ) : (
            <>
              <Sparkles className="w-5 h-5 fill-slate-950" />
              <span>دخول الغرفة</span>
              <ArrowLeft className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pb-2">
        <span className="text-xs text-slate-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
          PartyHub — تجربة سهرة تفاعلية
        </span>
      </div>
    </div>
  );
}
