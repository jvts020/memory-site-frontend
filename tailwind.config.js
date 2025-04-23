/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme'); // Importa tema padrão

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      // Adiciona as fontes que vamos importar do Google Fonts
      fontFamily: {
        // sans: ['Inter', ...defaultTheme.fontFamily.sans], // Define Inter como fonte padrão
        // Ou crie nomes específicos:
        sans: ['Inter', ...defaultTheme.fontFamily.sans], // Fonte padrão do corpo
        heading: ['Poppins', ...defaultTheme.fontFamily.sans], // Fonte para títulos
      },
      // Exemplo de cores customizadas (opcional)
      colors: {
        'space-dark': '#0f172a', // Um azul/preto escuro (slate-900)
        'space-light': '#e0e7ff', // Um indigo bem claro (indigo-100)
        'space-accent': '#818cf8', // Um tom de indigo/roxo (indigo-400)
      },
      // Ajuste para o plugin de tipografia (prose) usar as cores certas no tema escuro
      typography: ({ theme }) => ({
        invert: { // Estilos para quando usar 'prose-invert' em fundo escuro
          css: {
            '--tw-prose-body': theme('colors.slate[300]'), // Cor do parágrafo
            '--tw-prose-headings': theme('colors.slate[100]'), // Cor dos títulos
            '--tw-prose-lead': theme('colors.slate[400]'),
            '--tw-prose-links': theme('colors.indigo[400]'),
            '--tw-prose-bold': theme('colors.slate[100]'),
            // ... outras customizações do prose se necessário
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // Garanta que este plugin está aqui
    // require('@tailwindcss/aspect-ratio'), // Adicione se usou no passo anterior
  ],
};