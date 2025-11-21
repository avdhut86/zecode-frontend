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
