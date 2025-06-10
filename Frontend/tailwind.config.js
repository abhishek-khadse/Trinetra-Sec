/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          50: '#e6fcff',
          100: '#ccf9ff',
          200: '#99f3ff',
          300: '#66ecff',
          400: '#33e6ff',
          500: '#00EEFF', // Electric blue - primary
          600: '#00bfcc',
          700: '#008f99',
          800: '#006066',
          900: '#003033',
        },
        // Secondary colors
        secondary: {
          50: '#ffe6e6',
          100: '#ffcccc',
          200: '#ff9999',
          300: '#ff6666',
          400: '#ff3333',
          500: '#FF3E3E', // Red - secondary
          600: '#cc0000',
          700: '#990000',
          800: '#660000',
          900: '#330000',
        },
        // Dark theme colors
        dark: {
          100: '#d5d5d5',
          200: '#ababab',
          300: '#808080',
          400: '#565656',
          500: '#2b2b2b',
          600: '#232323',
          700: '#1e1e1e',
          800: '#151515', // Main background
          900: '#0c0c0c',
        },
        // Status colors
        success: '#10B981', // Green
        warning: '#FBBF24', // Yellow
        error: '#EF4444',   // Red
        info: '#3B82F6',    // Blue
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        glow: {
          '0%, 100%': { 
            textShadow: '0 0 5px rgba(0, 238, 255, 0.5), 0 0 10px rgba(0, 238, 255, 0.3)' 
          },
          '50%': { 
            textShadow: '0 0 20px rgba(0, 238, 255, 0.8), 0 0 30px rgba(0, 238, 255, 0.5)' 
          },
        },
        redGlow: {
          '0%, 100%': { 
            textShadow: '0 0 5px rgba(255, 62, 62, 0.5), 0 0 10px rgba(255, 62, 62, 0.3)' 
          },
          '50%': { 
            textShadow: '0 0 20px rgba(255, 62, 62, 0.8), 0 0 30px rgba(255, 62, 62, 0.5)' 
          },
        }
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite',
        'red-glow': 'redGlow 2s ease-in-out infinite',
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00EEFF, 0 0 10px #00EEFF',
        'neon-red': '0 0 5px #FF3E3E, 0 0 10px #FF3E3E',
      },
    },
  },
  plugins: [],
};