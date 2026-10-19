import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Sparkles, ArrowRight } from 'lucide-react';
import { usePartyStore } from '../../store/usePartyStore';
import { haptics } from '../../utils/haptics';

// Cute playful avatars inspired by the casual character collection
const AVATARS = [
  '🦊', '🦁', '🐼', '🐵', '🐱', '🐰',
  '🐻', '🐨', '🐧', '🐯', '🦄', '🐸',
];

interface Props {
  onJoined: () => void;
}

export default function ControllerJoin({ onJoined }: Props) {
  const [searchParams] = useSearchParams();
  const { joinRoom, playerName, playerAvatar, roomCode } = usePartyStore();

  const [code, setCode] = useState(searchParams.get('room') || roomCode || '');
  const [name, setName] = useState(playerName || '');
  const [avatar, setAvatar] = useState(playerAvatar || '🦊');
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
    <div className="min-h-screen playful-bg flex flex-col justify-between p-4 md:p-6 select-none overflow-y-auto">
      {/* ─── TOP CHARACTER PREVIEW BANNER (MATCHING REFERENCE UI) ─────────── */}
      <div className="text-center pt-2">
        <div className="relative inline-block mb-2">
          {/* Outer glowing pastel circle */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 via-pink-400 to-amber-300 p-1 shadow-xl animate-pulse">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-5xl">
              {avatar}
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
            لاعب
          </span>
        </div>

        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
          انضمام للسهرة 🎉
        </h1>
        <p className="text-slate-400 text-xs mt-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>
          اختر شخصيتك وادخل الكود لتلعب مع الشلة!
        </p>
      </div>

      {/* ─── FLOATING WHITE/PLAYFUL CARD FORM ──────────────────────────────── */}
      <form onSubmit={handleSubmit} className="playful-card p-5 max-w-sm mx-auto w-full my-3 space-y-4 shadow-2xl">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs text-center font-bold"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            {error}
          </motion.div>
        )}

        {/* Room Code Input */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
            كود الغرفة (4 أحرف)
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            placeholder="مثال: KSA9"
            className="w-full text-center text-3xl font-black tracking-widest bg-slate-950/80 border-2 border-slate-700 focus:border-amber-400 rounded-2xl py-2.5 text-white uppercase placeholder:text-slate-700 outline-none transition-colors shadow-inner font-mono"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          />
        </div>

        {/* Player Name Input */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
            اسمك المستعار
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
              placeholder="اكتب اسمك هنا..."
              className="w-full bg-slate-950/80 border-2 border-slate-700 focus:border-purple-400 rounded-2xl px-4 py-2.5 text-white text-sm outline-none transition-colors shadow-inner font-bold"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            />
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          </div>
        </div>

        {/* Avatar Character Picker Grid */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-300" style={{ fontFamily: 'Cairo, sans-serif' }}>
              اختر شخصيتك الكارتونية:
            </label>
            <span className="text-[10px] text-amber-300 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              اضغط للاختيار
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800 shadow-inner">
            {AVATARS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => {
                  setAvatar(emoji);
                  haptics.light();
                }}
                className={`text-2xl p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  avatar === emoji
                    ? 'bg-gradient-to-br from-amber-400/30 to-rose-400/30 border-2 border-amber-400 scale-110 shadow-lg'
                    : 'hover:bg-slate-800 hover:scale-105'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Tactile Peach / Coral Submit Button (Like BELI button) */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 btn-playful-peach text-base flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          <span>{isLoading ? 'جاري الانضمام...' : 'دخول اللعبة الآن'}</span>
          <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </form>

      {/* Footer */}
      <div className="text-center pb-2 text-[11px] text-slate-500" style={{ fontFamily: 'Cairo, sans-serif' }}>
        PartyHub — العاب السهرة والمجلس
      </div>
    </div>
  );
}
