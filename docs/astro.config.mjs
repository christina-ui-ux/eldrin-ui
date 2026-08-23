// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://christina-ui-ux.github.io',
	base: '/eldrin-ui',
	server: {
		port: 4321,
		host: 'localhost',
		// Fail if 4321 is taken instead of silently hopping to the next port.
		strictPort: true,
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
