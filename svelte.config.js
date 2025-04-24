// svelte.config.js
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build', // Pasta onde o site estático será gerado
			assets: 'build', // Onde os assets (JS/CSS) vão
			fallback: 'index.html', // Ou '404.html' - importante para SvelteKit funcionar
			precompress: false,
			strict: true
		}),
		// ... talvez 'alias' ou outras configs ...
	},
	// ... talvez 'preprocess' ...
};
export default config;