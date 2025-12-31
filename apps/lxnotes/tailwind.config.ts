import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['class'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.35rem", // Compact padding (was 2rem)
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Dark mode optimized colors for theater environment
        bg: {
          primary: '#0a0a0a',
          secondary: '#141414',
          tertiary: '#1f1f1f',
          hover: '#2a2a2a'
        },
        text: {
          primary: '#f5f5f5',
          secondary: '#b3b3b3',
          muted: '#737373',
          inverse: '#0a0a0a'
        },
        status: {
          todo: '#3b82f6',
          inProgress: '#f59e0b',
          complete: '#10b981',
          cancelled: '#dc2626'
        },
        priority: {
          high: '#ef4444',
          medium: '#f97316',
          low: '#22c55e'
        },
        modules: {
          cue: '#8b5cf6',
          work: '#3b82f6',
          production: '#06b6d4'
        },
        // Theatrical lighting gel colors
        gel: {
          'r26': '#F44336',      // Light Red
          'r77': '#8B0000',      // Dark Red
          'l200': '#1E3A8A',     // Double CT Blue
          'l201': '#FFA500',     // Full CT Orange
          'g200': '#22C55E',     // Double CT Green
        },
        // Stage zones (inspired by lighting areas)
        zone: {
          downstage: '#8b5cf6',
          midstage: '#3b82f6',
          upstage: '#06b6d4',
          wings: '#1f2937'
        },
        // Lighting qualities
        quality: {
          key: '#f5f5f5',        // Key light (bright, neutral)
          fill: '#b3b3b3',       // Fill light (softer)
          rim: '#60a5fa',        // Rim/back light (cool)
          special: '#fbbf24',    // Special/accent (warm)
          ambient: '#4b5563'     // Ambient/wash (neutral)
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        'compact-1': 'var(--space-compact-1)',
        'compact-2': 'var(--space-compact-2)',
        'compact-3': 'var(--space-compact-3)',
        'compact-4': 'var(--space-compact-4)',
        'compact-6': 'var(--space-compact-6)',
        'compact-8': 'var(--space-compact-8)',
      },
      height: {
        'compact-7': '1.575rem',
        'compact-8': '1.8rem',
        'compact-9': '2.025rem',
        'compact-10': '2.25rem',
      },
      fontFamily: {
        // Headings: Strong, architectural presence
        display: ['var(--font-space-grotesk)', 'Inter', 'system-ui'],

        // Body/UI: Technical precision, excellent readability
        sans: ['var(--font-inter)', 'system-ui'],

        // Technical data: Monospace for channels, cue numbers, etc.
        mono: ['var(--font-jetbrains-mono)', 'Monaco', 'Courier New'],

        // Script/handwriting feel for notes
        script: ['var(--font-caveat)', 'cursive'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Theatrical lighting transitions
        'fade-cue': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'crossfade-in': {
          '0%': { opacity: '0', filter: 'blur(4px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' }
        },
        'intensity-up': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '60%': { opacity: '0.8' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'focus-in': {
          '0%': { filter: 'blur(8px)', opacity: '0' },
          '100%': { filter: 'blur(0px)', opacity: '1' }
        },
        'subtle-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'cue-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px -5px currentColor' },
          '50%': { boxShadow: '0 0 40px -5px currentColor' }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Theatrical timing functions
        'fade-cue': 'fade-cue 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        'crossfade-in': 'crossfade-in 1s cubic-bezier(0.33, 1, 0.68, 1)',
        'intensity-up': 'intensity-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'focus-in': 'focus-in 1.2s cubic-bezier(0.33, 1, 0.68, 1)',
        'gobo-rotate': 'subtle-rotate 20s linear infinite',
        'cue-pulse': 'cue-pulse 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite'
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;