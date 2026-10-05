/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#EA580C', // Primary action accent
          600: '#C2410C', // Primary hover
          700: '#9A3412', // Primary active
          800: '#7C2D12',
          900: '#431407',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        state: {
          available: '#10B981',
          'available-subtle': '#ECFDF5',
          active: '#F59E0B',
          'active-subtle': '#FFFBEB',
          payPending: '#8B5CF6',
          'payPending-subtle': '#F5F3FF',
          paid: '#059669',
          'paid-subtle': '#ECFDF5',
          closed: '#94A3B8',
          'closed-subtle': '#F1F5F9',
          orderNew: '#0EA5E9',
          orderPrep: '#F59E0B',
          orderReady: '#10B981',
          orderServed: '#64748B',
          soldOut: '#EF4444',
          'soldOut-subtle': '#FEF2F2',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0px 1px 3px 0px rgba(15, 23, 42, 0.06), 0px 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'medium': '0px 4px 6px -1px rgba(15, 23, 42, 0.08), 0px 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'elevated': '0px -4px 16px 0px rgba(15, 23, 42, 0.08)',
        'overlay': '0px 25px 50px -12px rgba(15, 23, 42, 0.25)',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '10px',
        'lg': '16px',
        'xl': '24px',
      }
    },
  },
  plugins: [],
};
