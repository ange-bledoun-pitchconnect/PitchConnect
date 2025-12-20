import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },

      colors: {
        gold: {
          '50': '#FFFCF5',
          '100': '#FFF9EB',
          '200': '#FEF0C7',
          '300': '#FDE68A',
          '400': '#FCD34D',
          '500': '#D4AF37',
          '600': '#B8860B',
          '700': '#9A7410',
          '800': '#7C5E0F',
          '900': '#654B0D',
          'DEFAULT': '#D4AF37',
        },
        orange: {
          '50': '#FFF7ED',
          '100': '#FFEDD5',
          '200': '#FED7AA',
          '300': '#FDBA74',
          '400': '#FF6B35',
          '500': '#F97316',
          '600': '#EA580C',
          '700': '#C2410C',
          '800': '#9A3412',
          '900': '#7C2D12',
          'DEFAULT': '#FF6B35',
        },
        purple: {
          '50': '#FAF5FF',
          '100': '#F3E8FF',
          '200': '#E9D5FF',
          '300': '#D8B4FE',
          '400': '#C084FC',
          '500': '#A855F7',
          '600': '#9333EA',
          '700': '#7E22CE',
          '800': '#6B21A8',
          '900': '#581C87',
          'DEFAULT': '#A855F7',
        },
        charcoal: {
          '50': '#F9FAFB',
          '100': '#F3F4F6',
          '200': '#E5E7EB',
          '300': '#D1D5DB',
          '400': '#9CA3AF',
          '500': '#6B7280',
          '600': '#4B5563',
          '700': '#374151',
          '800': '#1F2937',
          '900': '#111827',
          '950': '#030712',
          'DEFAULT': '#1F2937',
        },
        neutral: {
          '0': '#FFFFFF',
          '50': '#FAFAFA',
          '100': '#F5F5F5',
          '200': '#E5E5E5',
          '300': '#D4D4D4',
          '400': '#A3A3A3',
          '500': '#737373',
          '600': '#525252',
          '700': '#404040',
          '800': '#262626',
          '900': '#171717',
          'DEFAULT': '#F5F5F5',
        },
        success: {
          'light': '#10B981',
          'DEFAULT': '#059669',
          'dark': '#047857',
        },
        error: {
          'light': '#F87171',
          'DEFAULT': '#EF4444',
          'dark': '#DC2626',
        },
        warning: {
          'light': '#FBBF24',
          'DEFAULT': '#F59E0B',
          'dark': '#D97706',
        },
        info: {
          'light': '#60A5FA',
          'DEFAULT': '#3B82F6',
          'dark': '#2563EB',
        },
        injury: {
          'light': '#FCA5A5',
          'DEFAULT': '#EF4444',
          'dark': '#DC2626',
        },
        fitness: {
          'light': '#86EFAC',
          'DEFAULT': '#22C55E',
          'dark': '#16A34A',
        },
        performance: {
          'light': '#60A5FA',
          'DEFAULT': '#3B82F6',
          'dark': '#2563EB',
        },
        recovery: {
          'light': '#A78BFA',
          'DEFAULT': '#8B5CF6',
          'dark': '#7C3AED',
        },
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          'DEFAULT': 'hsl(var(--card) / <alpha-value>)',
          'foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          'DEFAULT': 'hsl(var(--popover) / <alpha-value>)',
          'foreground': 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          'DEFAULT': 'hsl(var(--primary) / <alpha-value>)',
          'foreground': 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          'DEFAULT': 'hsl(var(--secondary) / <alpha-value>)',
          'foreground': 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          'DEFAULT': 'hsl(var(--muted) / <alpha-value>)',
          'foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          'DEFAULT': 'hsl(var(--accent) / <alpha-value>)',
          'foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          'DEFAULT': 'hsl(var(--destructive) / <alpha-value>)',
          'foreground': 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        chart: {
          '1': 'hsl(var(--chart-1) / <alpha-value>)',
          '2': 'hsl(var(--chart-2) / <alpha-value>)',
          '3': 'hsl(var(--chart-3) / <alpha-value>)',
          '4': 'hsl(var(--chart-4) / <alpha-value>)',
          '5': 'hsl(var(--chart-5) / <alpha-value>)',
        },
      },

      fontFamily: {
        'sans': ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        'mono': defaultTheme.fontFamily.mono,
        'display': ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.015em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem', { lineHeight: '4.5rem', letterSpacing: '-0.03em' }],
        '7xl': ['4.5rem', { lineHeight: '5.625rem', letterSpacing: '-0.04em' }],
      },

      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
        'gradient-orange': 'linear-gradient(135deg, #FF6B35 0%, #F97316 100%)',
        'gradient-purple': 'linear-gradient(135deg, #A855F7 0%, #C084FC 100%)',
        'gradient-hero': 'linear-gradient(135deg, #D4AF37 0%, #FF6B35 50%, #A855F7 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        'gradient-injury': 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)',
        'gradient-fitness': 'linear-gradient(135deg, #86EFAC 0%, #22C55E 100%)',
        'gradient-performance': 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
        'gradient-recovery': 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
      },

      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'gold': '0 10px 25px -5px rgba(212, 175, 55, 0.3)',
        'purple': '0 10px 25px -5px rgba(168, 85, 247, 0.3)',
        'orange': '0 10px 25px -5px rgba(255, 107, 53, 0.3)',
        'injury': '0 10px 25px -5px rgba(239, 68, 68, 0.2)',
        'fitness': '0 10px 25px -5px rgba(34, 197, 94, 0.2)',
        'performance': '0 10px 25px -5px rgba(59, 130, 246, 0.2)',
      },

      animation: {
        'fade-in': 'fadeIn 300ms ease-in-out forwards',
        'fade-out': 'fadeOut 300ms ease-in-out forwards',
        'slide-up': 'slideUp 400ms ease-out forwards',
        'slide-down': 'slideDown 400ms ease-out forwards',
        'slide-left': 'slideLeft 400ms ease-out forwards',
        'slide-right': 'slideRight 400ms ease-out forwards',
        'scale-in': 'scaleIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scale-out': 'scaleOut 250ms ease-in forwards',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-sm': 'bounceSm 1s ease-in-out infinite',
        'pulse-injury': 'pulseInjury 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeOut: { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideLeft: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        slideRight: { '0%': { opacity: '0', transform: 'translateX(-20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        scaleOut: { '0%': { opacity: '1', transform: 'scale(1)' }, '100%': { opacity: '0', transform: 'scale(0.95)' } },
        pulseGlow: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        pulseInjury: { '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' }, '50%': { opacity: '0.8', boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        bounceSm: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },

      spacing: {
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
        '176': '44rem',
        '192': '48rem',
      },

      borderRadius: {
        '4xl': '2rem',
        'lg': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'sm': 'calc(var(--radius) - 4px)',
      },

      container: {
        center: true,
        padding: {
          'DEFAULT': '1rem',
          'xs': '0.5rem',
          'sm': '1rem',
          'md': '1.5rem',
          'lg': '2rem',
          'xl': '3rem',
          '2xl': '4rem',
        },
      },

      transitionDuration: {
        '50': '50ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },

      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'dropdown': '1000',
        'modal': '1050',
        'popover': '1100',
        'tooltip': '1150',
        'notification': '1200',
        'max': '9999',
      },

      aspectRatio: {
        'video': '16 / 9',
        'square': '1 / 1',
        'portrait': '3 / 4',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),

    plugin(function ({ addUtilities, theme }) {
      addUtilities({
        '.player-card': {
          'position': 'relative',
          'overflow': 'hidden',
          'borderRadius': theme('borderRadius.lg'),
          'boxShadow': theme('boxShadow.md'),
          'transition': 'all 300ms',
        },
        '.stat-badge': {
          'display': 'inline-flex',
          'alignItems': 'center',
          'justifyContent': 'center',
          'minWidth': '2.5rem',
          'minHeight': '2.5rem',
          'borderRadius': theme('borderRadius.full'),
          'fontWeight': '600',
        },
        '.shimmer-loading': {
          'animation': 'shimmer 2s infinite',
        },
      })
    }),
  ],
}

export default config
