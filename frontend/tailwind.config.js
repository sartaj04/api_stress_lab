/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Clean matte palette - no purple
                background: '#111113',  // Softer dark gray, not pure black
                surface: {
                    50: 'rgba(255,255,255,0.03)',
                    100: 'rgba(255,255,255,0.05)',
                    200: 'rgba(255,255,255,0.08)',
                },
                border: {
                    DEFAULT: 'rgba(255,255,255,0.08)',
                    hover: 'rgba(255,255,255,0.15)',
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: 'rgba(255,255,255,0.6)',
                    muted: 'rgba(255,255,255,0.4)',
                },
                // Matte accent - clean white/off-white
                accent: {
                    DEFAULT: '#FFFFFF',
                    muted: 'rgba(255,255,255,0.9)',
                },
                // Status colors (matte, not vibrant)
                success: '#3FB950',
                warning: '#D29922',
                error: '#F85149',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            fontSize: {
                'hero': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
                'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
            },
        },
    },
    plugins: [],
}
