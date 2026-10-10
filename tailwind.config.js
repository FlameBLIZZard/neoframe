/** NEOFRAME — Tailwind build config. Run: npm run build:css */
module.exports = {
  content: ['./src/index.html'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        paper: '#FFFFFF',
        acid: '#FAFF00',
        hot: '#FF0080',
        cyan: '#00F0FF',
        smoke: '#F3F3F0',
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        marker: ['"Permanent Marker"', 'cursive'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        brut: '6px 6px 0 0 #000',
        'brut-sm': '3px 3px 0 0 #000',
        'brut-lg': '10px 10px 0 0 #000',
      },
    },
  },
};
