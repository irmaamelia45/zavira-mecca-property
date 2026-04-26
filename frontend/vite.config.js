import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const createProxyEntry = (target) => ({
    target,
    changeOrigin: true,
    secure: false,
});

const envDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, envDir, '');
    const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';

    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api': createProxyEntry(proxyTarget),
                '/storage': createProxyEntry(proxyTarget),
                '/uploads': createProxyEntry(proxyTarget),
            },
        },
    };
});
