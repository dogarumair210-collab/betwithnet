/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./games/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          950: '#07030d',
          900: '#0f071a',
          850: '#150a26',
          800: '#1e0f36',
          700: '#2d1452',
          600: '#3e1c6e',
          500: '#5a269c',
          400: '#7b38d4',
          accent: '#9d4edd',
        },
        gold: {
          light: '#fff1a8',
          DEFAULT: '#ffd700',
          dark: '#b38f00',
          gradient: 'linear-gradient(135deg, #fff7c2 0%, #ffd700 35%, #d4af37 70%, #8a5a00 100%)'
        },
        neon: {
          cyan: '#00f7ff',
          ruby: '#ff2d55',
          emerald: '#00e676',
          amber: '#ffb300',
          purple: '#b026ff'
        }
      },
      fontFamily: {
        display: ['"Cinzel"', '"Russo One"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'neon-gold': '0 0 25px rgba(255, 215, 0, 0.45), inset 0 0 15px rgba(255, 215, 0, 0.2)',
        'neon-cyan': '0 0 25px rgba(0, 247, 255, 0.5), inset 0 0 15px rgba(0, 247, 255, 0.25)',
        'neon-ruby': '0 0 25px rgba(255, 45, 85, 0.5), inset 0 0 15px rgba(255, 45, 85, 0.25)',
        'neon-emerald': '0 0 25px rgba(0, 230, 118, 0.5), inset 0 0 15px rgba(0, 230, 118, 0.25)',
        'glass-panel': '0 10px 40px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'stage-glow': '0 0 50px rgba(176, 38, 255, 0.35)'
      },
      animation: {
        'hand-shake': 'handShake 0.6s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'shimmer': 'shimmer 2.5s infinite linear',
        'float': 'float 3s ease-in-out infinite',
        'scale-pop': 'scalePop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      },
      keyframes: {
        handShake: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-20px) rotate(-10deg)' },
          '75%': { transform: 'translateY(8px) rotate(8deg)' }
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 25px rgba(255, 215, 0, 0.95))' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        scalePop: {
          '0%': { transform: 'scale(0.85)', opacity: '0.6' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
