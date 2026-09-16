const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    blue: '#0B2A47',        // azul oscuro (color principal)
                    'blue-mid': '#1F5C8C',  // azul medio (degradado, acentos)
                    'blue-dark': '#071D30', // azul casi negro (hover)
                    cyan: '#3FA9D1',        // celeste oscurecido
                    mango: '#C97A0E',       // naranja oscurecido (acento menor)
                    'mango-dark': '#A6620A',// naranja hover
                    peach: '#E8B978',       // durazno oscurecido
                    leaf: '#2AA39C',        // turquesa oscurecido
                    lime: '#7FA82E',        // verde lima oscurecido
                },
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseSoft: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.15)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-400px 0' },
                    '100%': { backgroundPosition: '400px 0' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out both',
                'fade-in-up': 'fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
                'fade-in-down': 'fadeInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
                'scale-in': 'scaleIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) both',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                shimmer: 'shimmer 1.8s linear infinite',
            },
            transitionTimingFunction: {
                'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
        },
    },

    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'), // ✅ importante
    ],
};
