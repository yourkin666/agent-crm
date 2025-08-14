import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: 'jsdom',
		globals: true,
		include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
		exclude: ['node_modules', 'dist', '.next'],
		coverage: {
			reporter: ['text', 'html', 'json'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['**/*.d.ts'],
		},
	},
}); 