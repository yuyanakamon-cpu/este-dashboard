/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Pattern D: Burgundy Jewelry
        bg: { DEFAULT: '#F8F5F2', card: '#FFFFFF', muted: '#FBF9F6', soft: '#F1ECE5' },
        burgundy: { DEFAULT: '#722F37', light: '#8B3A42', dark: '#5A2329' },
        gold: { DEFAULT: '#D4AF37', light: '#E8C76C', deep: '#8B7330', bg: '#FBF6E6' },
        ink: { 1: '#1F1A18', 2: '#5C534F', 3: '#A89280', 4: '#D4C7BD' },
        emerald2: { DEFAULT: '#5C8C6F', bg: 'rgba(92,140,111,0.10)' },
        rose2: { DEFAULT: '#C76B6B', bg: 'rgba(199,107,107,0.10)' },
        amber2: { DEFAULT: '#C49A4A', bg: 'rgba(196,154,74,0.10)' },
        edge: { DEFAULT: 'rgba(114,47,55,0.12)', soft: '#E8DCD0', gold: 'rgba(212,175,55,0.25)' },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Noto Serif JP', 'serif'],
        sans:  ['Inter', 'Noto Sans JP', '-apple-system', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'pd-sm': '6px', 'pd': '10px', 'pd-lg': '14px', 'pd-xl': '18px',
      },
      boxShadow: {
        'pd-sm': '0 1px 2px rgba(114,47,55,0.04), 0 1px 1px rgba(31,26,24,0.03)',
        'pd':    '0 4px 16px rgba(114,47,55,0.06), 0 1px 2px rgba(31,26,24,0.04)',
        'pd-lg': '0 16px 40px rgba(114,47,55,0.10), 0 4px 12px rgba(31,26,24,0.04)',
        'pd-gold': '0 6px 20px rgba(212,175,55,0.20)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease both',
        'slide-up': 'slideUp 0.4s ease both',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
