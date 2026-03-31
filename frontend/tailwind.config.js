// tailwind.config.js
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary-fixed-variant": "#354a53",
        "secondary-container": "#cfe6f2",
        "on-primary-fixed-variant": "#544600",
        "tertiary": "#00696f",
        "surface-container-highest": "#e5e2e1",
        "on-surface": "#1c1b1b",
        "on-primary-fixed": "#221b00",
        "on-secondary-container": "#526772",
        "on-surface-variant": "#4d4632",
        "tertiary-container": "#00f0fc",
        "surface-variant": "#e5e2e1",
        "error-container": "#ffdad6",
        "secondary": "#4c616c",
        "on-secondary-fixed": "#071e27",
        "background": "#fcf9f8",
        "surface-container": "#f0edec",
        "surface": "#fcf9f8",
        "secondary-fixed": "#cfe6f2",
        "inverse-on-surface": "#f3f0ef",
        "surface-container-high": "#ebe7e7",
        "on-error": "#ffffff",
        "surface-bright": "#fcf9f8",
        "surface-dim": "#dcd9d9",
        "outline-variant": "#d0c6ab",
        "on-tertiary": "#ffffff",
        "on-primary": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "on-tertiary-container": "#00696f",
        "on-primary-container": "#705d00",
        "on-error-container": "#93000a",
        "inverse-primary": "#e9c400",
        "on-tertiary-fixed": "#002022",
        "tertiary-fixed-dim": "#00dce7",
        "primary": "#705d00",
        "inverse-surface": "#313030",
        "on-background": "#1c1b1b",
        "secondary-fixed-dim": "#b4cad6",
        "primary-fixed": "#ffe170",
        "error": "#ba1a1a",
        "primary-container": "#ffd600",
        "primary-fixed-dim": "#e9c400",
        "surface-tint": "#705d00",
        "outline": "#7f775f",
        "tertiary-fixed": "#70f6ff",
        "on-secondary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-fixed-variant": "#004f53"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"], // Dodaj "sans-serif" jako fallback
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}