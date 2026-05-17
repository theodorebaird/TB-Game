/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#1a0f08",
        bg2: "#2a1a10",
        ink: "#dbb98b",
        "ink-bright": "#f0d9a8",
        gold: "#d4b048",
        ember: "#c97b3a",
        bloom: "#5fa86b",
        rust: "#b94a4a",
        choir: "#7a6dbf",
        line: "#3a2515",
      },
      fontFamily: {
        display: ["Cinzel", "Impact", "Arial Black", "sans-serif"],
        serif: ["'IM Fell English'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
