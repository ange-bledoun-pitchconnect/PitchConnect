/**
 * ============================================================================
 * 🏆 PITCHCONNECT - TAILWIND CSS CONFIGURATION v2.0
 * ============================================================================
 * Elite Sports Management Design System
 * 
 * Features:
 * ✅ Custom color system (Gold, Orange, Purple, Charcoal)
 * ✅ Sports-focused animations & utilities
 * ✅ Dark mode support (class-based)
 * ✅ Responsive design (xs to 3xl breakpoints)
 * ✅ Role-based theming support
 * ✅ Premium glass morphism effects
 * ✅ Dashboard-ready utilities
 * ✅ Performance optimized
 * ✅ Production-ready plugins
 * ============================================================================
 */

import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  // ============================================================================
  // DARK MODE - Class-based for user preference control
  // ============================================================================
  darkMode: ['class'],

  // ============================================================================
  // CONTENT PATHS - Files to scan for Tailwind classes
  // ============================================================================
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // ============================================================================
  // THEME CONFIGURATION
  // ============================================================================
  theme: {
    // Responsive Breakpoints
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      'touch': { 'raw': '(hover: none)' },
      'hover': { 'raw': '(hover: hover)' },
    },

    // Container
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },

    extend: {
      // ====================================================================
      // COLORS
      // ====================================================================
      colors: {
        // Gold - Primary brand
        gold: {
          50: '#FFFCF5',
          100: '#FFF9EB',
          200: '#FEF0C7',
          300: '#FDE68A',
          400: '#FCD34D',
          500: '#D4AF37',
          600: '#B8860B',
          700: '#9A7410',
          800: '#7C5E0F',
          900: '#654B0D',
          950: '#422F08',
          DEFAULT: '#D4AF37',
        },

        // Orange - Secondary brand
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FF6B35',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
          DEFAULT: '#FF6B35',
        },

        // Purple - Accent
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          950: '#3B0764',
          DEFAULT: '#A855F7',
        },

        // Charcoal - Dark neutral
        charcoal: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
          DEFAULT: '#1F2937',
        },

        // Semantic Colors
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#16A34A',
        },

        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
        },

        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },

        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
        },

        // Sports-specific
        injury: { light: '#FCA5A5', DEFAULT: '#EF4444', dark: '#DC2626' },
        fitness: { light: '#86EFAC', DEFAULT: '#22C55E', dark: '#16A34A' },
        performance: { light: '#60A5FA', DEFAULT: '#3B82F6', dark: '#2563EB' },
        recovery: { light: '#A78BFA', DEFAULT: '#8B5CF6', dark: '#7C3AED' },
        training: { light: '#FCD34D', DEFAULT: '#F59E0B', dark: '#D97706' },

        // CSS Variables
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        chart: {
          1: 'hsl(var(--chart-1) / <alpha-value>)',
          2: 'hsl(var(--chart-2) / <alpha-value>)',
          3: 'hsl(var(--chart-3) / <alpha-value>)',
          4: 'hsl(var(--chart-4) / <alpha-value>)',
          5: 'hsl(var(--chart-5) / <alpha-value>)',
        },
      },

      // ====================================================================
      // TYPOGRAPHY
      // ====================================================================
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '7xl': ['4.5rem', { lineHeight: '1.05' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },

      // ====================================================================
      // BACKGROUNDS
      // ====================================================================
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
        'gradient-orange': 'linear-gradient(135deg, #FF6B35 0%, #F97316 100%)',
        'gradient-purple': 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)',
        'gradient-hero': 'linear-gradient(135deg, #D4AF37 0%, #FF6B35 50%, #A855F7 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        'gradient-pitch': 'linear-gradient(180deg, #16A34A 0%, #15803D 50%, #166534 100%)',
        'gradient-mesh': `
          radial-gradient(at 40% 20%, rgba(212, 175, 55, 0.15) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(255, 107, 53, 0.15) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(212, 175, 55, 0.1) 0px, transparent 50%),
          radial-gradient(at 80% 50%, rgba(255, 107, 53, 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(168, 85, 247, 0.15) 0px, transparent 50%)
        `,
      },

      // ====================================================================
      // SHADOWS
      // ====================================================================
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'gold': '0 10px 40px -10px rgba(212, 175, 55, 0.4)',
        'gold-lg': '0 20px 60px -15px rgba(212, 175, 55, 0.5)',
        'orange': '0 10px 40px -10px rgba(255, 107, 53, 0.4)',
        'purple': '0 10px 40px -10px rgba(168, 85, 247, 0.4)',
        'glow-gold': '0 0 30px rgba(212, 175, 55, 0.3)',
        'glow-primary': '0 0 30px hsl(var(--primary) / 0.3)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 30px -10px rgba(0, 0, 0, 0.15)',
      },

      // ====================================================================
      // BORDER RADIUS
      // ====================================================================
      borderRadius: {
        'sm': 'calc(var(--radius) - 4px)',
        'DEFAULT': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'lg': 'var(--radius)',
        'xl': 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // ====================================================================
      // SPACING
      // ====================================================================
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
      },

      // ====================================================================
      // Z-INDEX
      // ====================================================================
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
        'max': '9999',
      },

      // ====================================================================
      // ANIMATIONS
      // ====================================================================
      animation: {
        'fade-in': 'fadeIn 300ms ease-out forwards',
        'fade-out': 'fadeOut 300ms ease-out forwards',
        'slide-up': 'slideUp 400ms ease-out forwards',
        'slide-down': 'slideDown 400ms ease-out forwards',
        'slide-left': 'slideLeft 400ms ease-out forwards',
        'slide-right': 'slideRight 400ms ease-out forwards',
        'scale-in': 'scaleIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scale-out': 'scaleOut 200ms ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'score-update': 'scoreUpdate 500ms ease-out',
        'goal-celebration': 'goalCelebration 800ms ease-out',
        'pulse-live': 'pulseLive 2s ease-in-out infinite',
        'accordion-down': 'accordionDown 300ms ease-out',
        'accordion-up': 'accordionUp 300ms ease-out',
      },

      // ====================================================================
      // KEYFRAMES
      // ====================================================================
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(212, 175, 55, 0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scoreUpdate: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)', color: 'rgb(34, 197, 94)' },
          '100%': { transform: 'scale(1)' },
        },
        goalCelebration: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(1.2) rotate(-5deg)' },
          '50%': { transform: 'scale(1.3) rotate(5deg)' },
          '75%': { transform: 'scale(1.1) rotate(-3deg)' },
        },
        pulseLive: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        accordionDown: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        accordionUp: {
          '0%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
      },

      // ====================================================================
      // TRANSITIONS
      // ====================================================================
      transitionDuration: {
        '0': '0ms',
        '50': '50ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'snappy': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },

      // ====================================================================
      // ASPECT RATIO
      // ====================================================================
      aspectRatio: {
        'video': '16 / 9',
        'portrait': '3 / 4',
        'landscape': '4 / 3',
        'pitch': '68 / 105',
        'card': '5 / 7',
      },

      // ====================================================================
      // BACKDROP BLUR
      // ====================================================================
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },

  // ============================================================================
  // PLUGINS
  // ============================================================================
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),

    // Custom Utilities Plugin
    plugin(function ({ addUtilities, addComponents, matchUtilities, theme }) {
      // Utilities
      addUtilities({
        '.text-balance': { 'text-wrap': 'balance' },
        '.text-pretty': { 'text-wrap': 'pretty' },
        '.gpu': {
          'transform': 'translateZ(0)',
          'backface-visibility': 'hidden',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.gradient-text': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 0, 0, 0.2)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.05)',
        },
      })

      // Components
      addComponents({
        '.player-card': {
          'position': 'relative',
          'overflow': 'hidden',
          'border-radius': theme('borderRadius.xl'),
          'box-shadow': theme('boxShadow.md'),
          'transition': 'all 300ms',
          '&:hover': {
            'box-shadow': theme('boxShadow.xl'),
            'transform': 'translateY(-4px)',
          },
        },
        '.stat-badge': {
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'min-width': '2.5rem',
          'min-height': '2.5rem',
          'border-radius': theme('borderRadius.full'),
          'font-weight': '600',
          'font-variant-numeric': 'tabular-nums',
        },
        '.live-indicator': {
          'position': 'relative',
          'padding-left': '1rem',
          '&::before': {
            'content': '""',
            'position': 'absolute',
            'left': '0',
            'top': '50%',
            'transform': 'translateY(-50%)',
            'width': '0.5rem',
            'height': '0.5rem',
            'border-radius': '50%',
            'background-color': theme('colors.error.DEFAULT'),
            'animation': 'pulseLive 2s ease-in-out infinite',
          },
        },
      })

      // Animation Delay Utilities
      matchUtilities(
        {
          'animate-delay': (value) => ({ 'animation-delay': value }),
        },
        {
          values: {
            '0': '0ms', '75': '75ms', '100': '100ms', '150': '150ms',
            '200': '200ms', '300': '300ms', '400': '400ms', '500': '500ms',
            '600': '600ms', '700': '700ms', '800': '800ms',
          },
        }
      )
    }),
  ],
} satisfies Config

export default config