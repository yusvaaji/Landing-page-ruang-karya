/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./admin/**/*.html", "./src/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink: "#071726",
        navy: "#0b2a42",
        deep: "#081c2d",
        sky: "#8fd7ff",
        glow: "#4dc3ff"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(143,215,255,.22), 0 0 40px rgba(77,195,255,.18)"
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } }
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

