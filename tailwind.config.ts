import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultConfig'

const config: Config = {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            /**
             * =====================================================================
             * RESPONSIVE SCREENS - MOBILE-FIRST BREAKPOINTS
             * =====================================================================
             * 
             * Follow mobile-first approach:
             * - Default styles for mobile
             * - sm:, md:, lg: for larger screens
             * - Never use sm: as fallback, always mobile-default
             * 
             * Device Mapping:
             * - xs: 320px - Small phones (iPhone SE)
             * - sm: 640px - Large phones (iPhone 14 Pro Max)
             * - md: 768px - Tablets (iPad)
             * - lg: 1024px - Small laptops
             * - xl: 1280px - Large laptops
             * - 2xl: 1536px - Desktop monitors
             * - 3xl: 1920px - Large monitors
             */
            screens: {
                'xs': '320px',
                'sm': '640px',
                'md': '768px',
                'lg': '1024px',
                'xl': '1280px',
                '2xl': '1536px',
                '3xl': '1920px',
                // Custom screens for specific needs
                'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
                'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
                'portrait': { 'raw': '(orientation: portrait)' },
                'landscape': { 'raw': '(orientation: landscape)' },
                'dark-mode': { 'raw': '(prefers-color-scheme: dark)' },
                'light-mode': { 'raw': '(prefers-color-scheme: light)' },
                'print': { 'raw': 'print' },
            },

            /**
             * =====================================================================
             * COLORS - PITCHCONNECT DESIGN SYSTEM
             * =====================================================================
             * 
             * Brand Psychology:
             * 🥇 Gold (#D4AF37) - Premium, achievement, leadership, trust
             * 🔥 Orange (#FF6B35) - Energy, action, enthusiasm, momentum
             * 💜 Purple (#A855F7) - Innovation, creativity, collaboration
             * ⬛ Charcoal (#1F2937) - Authority, professionalism, clarity
             * 🤍 Neutral (white/gray) - Cleanliness, simplicity, accessibility
             * 
             * Usage Rules:
             * - Use gold for primary CTAs and highlights
             * - Use orange for secondary actions and success states
             * - Use purple for team/collaboration features
             * - Use charcoal for text and structural elements
             * - Use neutral for backgrounds and spacing
             */
            colors: {
                // Primary Brand Colors
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
                // Status Colors
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
                // CSS Variables for Light/Dark Mode
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    'DEFAULT': 'hsl(var(--card))',
                    'foreground': 'hsl(var(--card-foreground))',
                },
                popover: {
                    'DEFAULT': 'hsl(var(--popover))',
                    'foreground': 'hsl(var(--popover-foreground))',
                },
                primary: {
                    'DEFAULT': 'hsl(var(--primary))',
                    'foreground': 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    'DEFAULT': 'hsl(var(--secondary))',
                    'foreground': 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    'DEFAULT': 'hsl(var(--muted))',
                    'foreground': 'hsl(var(--muted-foreground))',
                },
                accent: {
                    'DEFAULT': 'hsl(var(--accent))',
                    'foreground': 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    'DEFAULT': 'hsl(var(--destructive))',
                    'foreground': 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))',
                },
            },

            /**
             * =====================================================================
             * FONTS - OPTIMIZED FOR PERFORMANCE & READABILITY
             * =====================================================================
             */
            fontFamily: {
                'inter': ['var(--font-inter)', 'Inter', ...fontFamily.sans],
                'sans': ['var(--font-inter)', 'Inter', ...fontFamily.sans],
                'mono': [
                    'ui-monospace',
                    'SFMono-Regular',
                    'Menlo',
                    'Monaco',
                    'Consolas',
                    'Liberation Mono',
                    'Courier New',
                    'monospace',
                ],
            },

            /**
             * =====================================================================
             * FONT SIZES - RESPONSIVE TYPOGRAPHY SCALE
             * =====================================================================
             * 
             * Scale: 1.125 (perfect fifth)
             * Uses line-height and letter-spacing for readability
             */
            fontSize: {
                'xs': [
                    '0.75rem',
                    {
                        lineHeight: '1rem',
                        letterSpacing: '0.015em',
                    },
                ],
                'sm': [
                    '0.875rem',
                    {
                        lineHeight: '1.25rem',
                        letterSpacing: '0.01em',
                    },
                ],
                'base': [
                    '1rem',
                    {
                        lineHeight: '1.5rem',
                        letterSpacing: '0em',
                    },
                ],
                'lg': [
                    '1.125rem',
                    {
                        lineHeight: '1.75rem',
                        letterSpacing: '-0.005em',
                    },
                ],
                'xl': [
                    '1.25rem',
                    {
                        lineHeight: '1.75rem',
                        letterSpacing: '-0.01em',
                    },
                ],
                '2xl': [
                    '1.5rem',
                    {
                        lineHeight: '2rem',
                        letterSpacing: '-0.01em',
                    },
                ],
                '3xl': [
                    '1.875rem',
                    {
                        lineHeight: '2.25rem',
                        letterSpacing: '-0.02em',
                    },
                ],
                '4xl': [
                    '2.25rem',
                    {
                        lineHeight: '2.5rem',
                        letterSpacing: '-0.025em',
                    },
                ],
                '5xl': [
                    '3rem',
                    {
                        lineHeight: '3.5rem',
                        letterSpacing: '-0.03em',
                    },
                ],
                '6xl': [
                    '3.75rem',
                    {
                        lineHeight: '4.5rem',
                        letterSpacing: '-0.03em',
                    },
                ],
                '7xl': [
                    '4.5rem',
                    {
                        lineHeight: '5.625rem',
                        letterSpacing: '-0.04em',
                    },
                ],
            },

            /**
             * =====================================================================
             * BACKGROUND GRADIENTS - PREMIUM VISUAL EFFECTS
             * =====================================================================
             */
            backgroundImage: {
                'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                'gradient-orange': 'linear-gradient(135deg, #FF6B35 0%, #F97316 100%)',
                'gradient-purple': 'linear-gradient(135deg, #A855F7 0%, #C084FC 100%)',
                'gradient-hero': 'linear-gradient(135deg, #D4AF37 0%, #FF6B35 50%, #A855F7 100%)',
                'gradient-dark': 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
                'gradient-mesh-light': 'radial-gradient(at 40% 20%, rgba(212, 175, 55, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168, 85, 247, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(255, 107, 53, 0.2) 0px, transparent 50%)',
                'gradient-mesh-dark': 'radial-gradient(at 40% 20%, rgba(212, 175, 55, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168, 85, 247, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(255, 107, 53, 0.1) 0px, transparent 50%)',
                'grid-pattern': 'linear-gradient(to right, #f3f4f6 1px, transparent 1px), linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)',
            },

            /**
             * =====================================================================
             * BOX SHADOWS - DEPTH & ELEVATION SYSTEM
             * =====================================================================
             * 
             * Elevation system for depth perception:
             * - sm: Subtle, baseline
             * - md: Hover/focus states
             * - lg: Important elevation
             * - xl/2xl: Modal/overlay elevation
             */
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
            },

            /**
             * =====================================================================
             * ANIMATIONS - SMOOTH, PURPOSEFUL TRANSITIONS
             * =====================================================================
             * 
             * Timing Guidelines:
             * - fade: 300ms (show/hide content)
             * - slide: 400ms (movement)
             * - scale: 250ms (emphasis)
             * - shimmer: 2s (loading states)
             */
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
                'gradient': 'gradient 15s ease infinite',
                'float': 'float 3s ease-in-out infinite',
                'bounce-sm': 'bounceSm 1s ease-in-out infinite',
            },

            /**
             * =====================================================================
             * KEYFRAMES - ANIMATION DEFINITIONS
             * =====================================================================
             */
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
                pulseGlow: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                bounceSm: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-4px)' },
                },
            },

            /**
             * =====================================================================
             * SPACING - CONSISTENT LAYOUT SCALE
             * =====================================================================
             */
            spacing: {
                '128': '32rem',
                '144': '36rem',
                '160': '40rem',
                '176': '44rem',
                '192': '48rem',
            },

            /**
             * =====================================================================
             * BORDER RADIUS - ROUNDED CORNER SYSTEM
             * =====================================================================
             * 
             * Hierarchy:
             * - sm: Small elements (buttons, badges)
             * - md: Medium elements (cards, inputs)
             * - lg: Large elements (modals, containers)
             * - xl/full: Extra large/perfect circles
             */
            borderRadius: {
                '4xl': '2rem',
                'lg': 'var(--radius)',
                'md': 'calc(var(--radius) - 2px)',
                'sm': 'calc(var(--radius) - 4px)',
            },

            /**
             * =====================================================================
             * CONTAINER QUERIES - COMPONENT-BASED RESPONSIVE DESIGN
             * =====================================================================
             * 
             * Allows components to be responsive to their container size
             * instead of viewport size
             */
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

            /**
             * =====================================================================
             * OPACITY - SUBTLE TRANSPARENCY SYSTEM
             * =====================================================================
             */
            opacity: {
                '0': '0',
                '5': '0.05',
                '10': '0.1',
                '20': '0.2',
                '30': '0.3',
                '40': '0.4',
                '50': '0.5',
                '60': '0.6',
                '70': '0.7',
                '80': '0.8',
                '90': '0.9',
                '95': '0.95',
                '100': '1',
            },

            /**
             * =====================================================================
             * TRANSITIONS & DURATIONS - SMOOTH UX
             * =====================================================================
             */
            transitionDuration: {
                '50': '50ms',
                '100': '100ms',
                '150': '150ms',
                '200': '200ms',
                '250': '250ms',
                '300': '300ms',
                '400': '400ms',
                '500': '500ms',
                '600': '600ms',
                '700': '700ms',
                '800': '800ms',
                '900': '900ms',
                '1000': '1000ms',
            },

            /**
             * =====================================================================
             * Z-INDEX LAYERING - STACKING CONTEXT
             * =====================================================================
             */
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
        },
    },

    plugins: [require('tailwindcss-animate')],
}

export default config
