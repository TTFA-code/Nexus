/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-rajdhani)', 'sans-serif'],
                heading: ['var(--font-orbitron)', 'sans-serif'],
            },
            colors: {
                // Only keeping our custom Cyber palette
                cyber: {
                    black: '#020205',
                    cyan: '#00f3ff',
                    purple: '#bc13fe',
                    pink: '#ff00ff',
                    slate: '#0a0a0f',
                },
                // Re-add standard colors if needed, 
                // but avoiding the 'hsl(var(...))' pattern that was breaking things.
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "grid-flow": {
                    "0%": { transform: "translateY(0)" },
                    "100%": { transform: "translateY(24px)" },
                },
                "beam-h": {
                    "0%": { left: "-10%", opacity: "0" },
                    "10%": { opacity: "1" },
                    "90%": { opacity: "1" },
                    "100%": { left: "110%", opacity: "0" },
                },
                "beam-v": {
                    "0%": { top: "-10%", opacity: "0" },
                    "10%": { opacity: "1" },
                    "90%": { opacity: "1" },
                    "100%": { top: "110%", opacity: "0" },
                },
                "glitch": {
                    "0%": { transform: "translate(0)" },
                    "20%": { transform: "translate(-2px, 2px)" },
                    "40%": { transform: "translate(-2px, -2px)" },
                    "60%": { transform: "translate(2px, 2px)" },
                    "80%": { transform: "translate(2px, -2px)" },
                    "100%": { transform: "translate(0)" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-3px)" },
                },
                "shake-rapid": {
                    "0%, 100%": { transform: "translateX(0)" },
                    "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
                    "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "grid-flow": "grid-flow 20s linear infinite",
                "beam-h-slow": "beam-h 8s linear infinite",
                "beam-h-fast": "beam-h 4s linear infinite",
                "beam-v-slow": "beam-v 8s linear infinite",
                "glitch": "glitch 0.2s cubic-bezier(.25, .46, .45, .94) both",
                "float": "float 3s ease-in-out infinite",
                "shake-rapid": "shake-rapid 0.4s linear both",
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
