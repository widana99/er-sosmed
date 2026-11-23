/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#F7F7F5',
          dark: '#0B0C0E',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#12141A',
          subtle: {
            light: '#EFEFED',
            dark: '#191C24',
          },
        },
        ink: {
          primary: {
            light: '#121316',
            dark: '#F4F5F7',
          },
          secondary: {
            light: '#525866',
            dark: '#99A0AE',
          },
          tertiary: {
            light: '#868C98',
            dark: '#636A79',
          },
        },
        brand: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          subtle: '#EEF2FF',
        },
        platform: {
          instagram: '#E1306C',
          tiktok: '#00F2FE',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'neoglass-light': '0 1px 0 0 rgba(255, 255, 255, 0.9) inset, 0 8px 32px -4px rgba(18, 19, 22, 0.05)',
        'neoglass-dark': '0 1px 0 0 rgba(255, 255, 255, 0.12) inset, 0 16px 40px -6px rgba(0, 0, 0, 0.50)',
        'glass-card': '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 1px 0 0 rgba(255, 255, 255, 0.8) inset',
        'glass-card-dark': '0 8px 30px -4px rgba(0, 0, 0, 0.4), 0 1px 0 0 rgba(255, 255, 255, 0.08) inset',
      },
    },
  },
  plugins: [],
}
