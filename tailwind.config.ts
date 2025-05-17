import type { Config } from "tailwindcss";

const config: Config = {
  // In Tailwind 4, darkMode: 'class' is no longer needed when using @custom-variant
  // But we keep it for backward compatibility with older Tailwind versions
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
      textShadow: {
        DEFAULT: '0 1px 2px rgba(0, 0, 0, 0.8)',
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(420px, 1fr))',
      }
    },
  },
  plugins: [
    // @ts-ignore - Ignoring the type issue with addUtilities
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};

export default config; 