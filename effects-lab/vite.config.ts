import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone showcase app — fixed port 5180 so it never clashes with the
// mumotor frontend (5173) or backend (4000).
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, host: true, strictPort: false },
  preview: { port: 5180 },
});
