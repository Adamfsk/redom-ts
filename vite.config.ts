import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {defineConfig} from "vite";
import swc from '@rollup/plugin-swc';

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, './src/index.ts'),
            name: 'redom',
            fileName: (format) => {
                if (format === 'es') {
                    return 'redom.mjs';
                }
                return `redom.js`;
            }
        },
        minify: false,
        outDir: './dist',
        reportCompressedSize: true,
        sourcemap: 'hidden',
        rollupOptions: {
            plugins: [
                swc()
            ]
        }
    }
});
