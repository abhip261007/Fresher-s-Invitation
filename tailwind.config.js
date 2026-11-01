/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        cait: {
          midnight: "#00072D",
          royal: "#051650",
          sapphire: "#0A2472",
          cobalt: "#123499",
          electric: "#1A43BF",
          cyan: "#38BDF8",
          amber: "#F59E0B",
        },
        muted: {
          DEFAULT: "rgba(10, 36, 114, 0.4)",
          foreground: "#94A3B8",
        },
      },
      fontFamily: {
        serif: ["Cinzel", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        display: ["Cinzel", "Outfit", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
