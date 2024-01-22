/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/*.html"],
  theme: {
    extend: {
      colors: {
        "editor-light": "#fffffe",
        "editor-dark": "#1e1e1e",
      },
    },
  },
  plugins: [],
};
