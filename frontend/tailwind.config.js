/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Trishul Design Tokens — "Wet Forest / Signal Amber"
        forest: {
          950: "#071A25",
          800: "#0D3040",
        },
        moss: {
          600: "#176476",
        },
        fern: {
          400: "#32C6C2",
        },
        mist: {
          50: "#F2FBFC",
        },
        stone: {
          200: "#D6E7E9",
        },
        ink: {
          900: "#071A25",
        },
        signal: {
          amber: "#FF9D2E",
        },
        // Rudra Level status colors — reserved exclusively for risk indicators
        rudra: {
          safe: "#28B78D",
          watch: "#F4C64E",
          warn: "#FF922B",
          evacuate: "#EF4E4E",
        },
        // Legacy surface colors (for existing dashboard pages during transition)
        surface: {
          950: "#0a0f14",
          900: "#0f1620",
          800: "#161f2c",
          700: "#1e2a3a",
          600: "#2a3a4d",
        },
        accent: {
          DEFAULT: "#3b9dd8",
          light: "#6ec3f2",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Source Serif 4", "Georgia", "serif"],
        sans: ["General Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        // Desktop scale
        'hero-h1': ['clamp(3.5rem, 8vw, 7rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'h2': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h3': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'body': ['1.05rem', { lineHeight: '1.65' }],
        'caption': ['0.85rem', { lineHeight: '1.5' }],
        // Mobile hero
        'mobile-hero-h1': ['clamp(2.5rem, 10vw, 3.25rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      maxWidth: {
        prose: '65ch',
      },
      spacing: {
        container: 'clamp(24px, 6vw, 96px)',
      },
      borderRadius: {
        btn: '6px',
        card: '14px',
        pill: '9999px',
      },
      transitionDuration: {
        reveal: '400ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      animation: {
        'reveal-up': 'revealUp 400ms ease-out forwards',
        'pulse-rudra': 'pulseRudra 1.8s ease-in-out infinite',
        'contour-drift': 'contourDrift 20s linear infinite',
        'logo-draw': 'logoDraw 1.2s ease-out forwards',
        'fade-in': 'fadeIn 400ms ease-out forwards',
        'underline-slide': 'underlineSlide 200ms ease-out forwards',
      },
      keyframes: {
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRudra: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.15)' },
        },
        contourDrift: {
          '0%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-2%) translateX(1%)' },
          '50%': { transform: 'translateY(0) translateX(-1%)' },
          '75%': { transform: 'translateY(2%) translateX(0)' },
          '100%': { transform: 'translateY(0) translateX(0)' },
        },
        logoDraw: {
          '0%': { strokeDashoffset: '1000', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { strokeDashoffset: '0', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        underlineSlide: {
          '0%': { width: '0', left: '0' },
          '100%': { width: '100%', left: '0' },
        },
      },
    },
  },
  plugins: [],
};
