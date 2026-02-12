import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        // Use Node.js environment (not jsdom) for server action tests
        environment: 'node',

        // Test file patterns
        include: ['**/__tests__/**/*.test.{js,ts}', '**/*.test.{js,ts}'],
        exclude: ['node_modules', '.next', 'dist'],

        // Global test timeout
        testTimeout: 15000,

        // Coverage configuration
        coverage: {
            provider: 'v8',
            include: ['lib/**/*.{js,ts}'],
            exclude: ['lib/api/**', 'lib/context/**', 'node_modules'],
            reporter: ['text', 'html'],
        },

        // Setup files
        setupFiles: ['./vitest.setup.js'],
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
