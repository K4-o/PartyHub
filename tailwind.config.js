/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Cairo', 'Readex Pro', 'sans-serif'],
      },
      colors: {
        neon: {
          emerald: '#00FF7F',
          amber: '#FFBF00',
          violet: '#8B5CF6',
          crimson: '#DC143C',
          cyan: '#00E5FF',
        },
        slate: {
          950: '#020617',
        },
      },
      animation: {
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flash-red': 'flashRed 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        glow: {
          from: { textShadow: '0 0 10px #00FF7F, 0 0 20px #00FF7F' },
          to: { textShadow: '0 0 20px #00FF7F, 0 0 40px #00FF7F, 0 0 80px #00FF7F' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(220, 20, 60, 0)' },
          '50%': { backgroundColor: 'rgba(220, 20, 60, 0.8)' },
          '100%': { backgroundColor: 'rgba(220, 20, 60, 0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
