/** @type {import('tailwindcss').Config} */
/*export default {
  content: ["./index.html", "./src/**//*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#2AC24A",
        ink: "#0B0B0B",
        muted: "#9AA0A6",
      },
    },
  },
  plugins: [],
};
*/

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
