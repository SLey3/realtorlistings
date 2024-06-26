import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    base: '/',
    plugins: [react(), viteTsconfigPaths()],
    server: {    
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000  
        port: 3000, 
        // proxy configuration used only for development. Production proxy setup found in vercel.json
        // proxy: {
        //     '/api' : {
        //         target: 'http://localhost:8000',
        //         changeOrigin: true,
        //         rewrite: (path) => path.replace(/^\/api/, ''),
        //     }
        // }
    },
    build: {
        chunkSizeWarningLimit: 1000,
    }
});
