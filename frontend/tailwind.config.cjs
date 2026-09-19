module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'primary-start': '#4F46E5',
        'primary-end': '#7C3AED',
        primary: '#6B46FF',
        secondary: '#0B1220',
        accent: '#06B6D4',
        success: '#10B981',
        warning: '#F59E0B',
        bg: '#FAFAFC',
        'bg-dark': '#0B0F19',
        card: 'rgba(255,255,255,0.7)',
        ink: '#0B1220',
        muted: '#64748B'
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif']
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
