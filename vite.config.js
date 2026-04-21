import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function autoClosePlugin() {
  let hasConnected = false;
  let timeout = null;
  return {
    name: 'auto-close',
    configureServer(server) {
      setInterval(() => {
        const clients = server.ws.clients.size;
        if (clients > 0) {
          hasConnected = true;
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
        } else if (hasConnected) {
          if (!timeout) {
            timeout = setTimeout(() => {
              if (server.ws.clients.size === 0) {
                console.log('\n🚪 [Auto-Close] Đã đóng hết Tab trình duyệt, tự động tắt Local Server để giải phóng cổng...\n');
                process.exit(0);
              }
            }, 5000); // Đợi 5 giây xem có tải lại trang không, nếu không thì tắt
          }
        }
      }, 2000);
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), autoClosePlugin()],
  server: {
    host: true,
  },
})
