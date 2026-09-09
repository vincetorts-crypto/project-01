/**
 * BRAND COLORS — PLACEHOLDER
 * Derived by eye from the Signco Fabrications logo (chrome-blue gradient + black).
 * Replace these hex values with exact brand hex codes once available and re-run
 * `npm run build:css`. Nothing else in the site needs to change — every page
 * references these token names, not raw hex values.
 */
module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a", // near-black, body text / dark sections
        navy: "#0b2a4a", // deepest blue in the logo gradient
        steel: "#1c5a8c", // mid steel-blue, primary brand blue
        sky: "#8fc7e8", // light chrome highlight, accent/glow
        surface: "#f5f7f9", // off-white background
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        body: ["Barlow", "sans-serif"],
      },
    },
  },
  plugins: [],
};
