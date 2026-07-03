/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ia: {
          bg: '#0B0B0D',
          surface: '#111214',
          card: '#17181B',
          border: '#2A2C31',
          text: '#FFFFFF',
          muted: '#9A9EA6',
          placeholder: '#6B7280',
          success: '#16C784',
          error: '#FF4D4F',
          warning: '#F5A524',
          info: '#3B82F6',
        },
      },
      borderRadius: {
        iaInput: '14px',
        iaButton: '14px',
        iaCard: '20px',
        iaModal: '24px',
      },
      boxShadow: {
        ia: '0 8px 24px rgba(0,0,0,.20)',
      },
      fontFamily: {
        sans: ['General Sans', 'Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        ia: '1280px',
      },
      transitionDuration: {
        ia: '200ms',
      },
    },
  },
  plugins: [],
};
