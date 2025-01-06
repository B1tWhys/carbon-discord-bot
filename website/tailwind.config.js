/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      aspectRatio: {
        video: "2092/1440",
      },
    },
  },
  plugins: [],
};
