import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#000000",
          red: "#C83232",
          ivory: "#F5F1ED",
          grey: "#D8DAD7",
        },
      },
      fontFamily: {
        din: ["DIN Condensed", "League Gothic", "Oswald", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        fireFlicker: {
          "0%": { transform: "scale(1) rotate(-5deg)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.3) rotate(5deg)", filter: "brightness(1.4)" },
          "100%": { transform: "scale(1.1) rotate(-3deg)", filter: "brightness(1.2)" },
        },
        pinBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        infoWobble: {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(-15deg) scale(1.15)" },
          "75%": { transform: "rotate(15deg) scale(1.15)" },
        },
      },
      animation: {
        fireFlicker: "fireFlicker 0.3s ease-in-out infinite alternate",
        pinBounce: "pinBounce 0.5s ease-in-out infinite",
        infoWobble: "infoWobble 0.4s ease-in-out infinite",
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: theme("colors.gray.800"),
            a: {
              color: theme("colors.brand.red"),
              "&:hover": { color: theme("colors.brand.black") },
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
