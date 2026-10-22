/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#effefa',100:'#d7f8ec',200:'#b0f0d9',300:'#7de5c2',400:'#47d3a6',500:'#25b78c',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a' },
        ink: { 900:'#0a1f2e', 950:'#061521' },
      },
      fontFamily: {
        sans: ['"Segoe UI"','Inter','system-ui','-apple-system','Roboto','"Noto Sans"','sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(13,148,136,.08), 0 8px 24px -12px rgba(13,148,136,.18)',
        glow: '0 0 0 3px rgba(13,148,136,.15)',
      },
      keyframes: {
        ecg: { '0%': { strokeDashoffset: '320' }, '100%': { strokeDashoffset: '0' } },
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.55' } },
      },
      animation: {
        ecg: 'ecg 2.6s linear infinite',
        ticker: 'ticker 30s linear infinite',
        floaty: 'floaty 5s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
