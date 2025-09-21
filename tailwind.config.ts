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
        sans: [
          'Roboto Condensed', 
          'Arial Narrow', 
          'Helvetica Neue', 
          'Arial', 
          'system-ui', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'sans-serif'
        ],
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;