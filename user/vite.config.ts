import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Exclude main.tsx from Fast Refresh since it's an entry point
      exclude: /node_modules/,
    }),
    tailwindcss(),
  ],
  server: {
    port: 5173, // User chạy trên port 5173
    strictPort: true, // Bắt buộc dùng port này, không tự động đổi
  },
})
