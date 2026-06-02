import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#060B10',
          surface: '#0B1520',
          hover: '#101E2C',
          border: '#182D3E',
          'border-hover': '#20405A',
          primary: '#3BA4DC',
          'primary-hover': '#55B8E8',
          danger: '#E0556A',
          'danger-hover': '#EB7A8A',
          success: '#36B89E',
          accent: '#5BBCE8',
          'text-primary': '#E2ECF2',
          'text-secondary': '#889EB0',
          'text-muted': '#587088',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        display: ['"LXGW WenKai"', '"Noto Sans SC"', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(59, 164, 220, 0.15)',
        'glow-sm': '0 0 8px rgba(59, 164, 220, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(59, 164, 220, 0.1)' },
          '50%': { boxShadow: '0 0 25px rgba(59, 164, 220, 0.25)' },
        },
      },
    },
  },
  plugins: [animate],
} satisfies Config
