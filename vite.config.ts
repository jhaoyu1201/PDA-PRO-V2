
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 必須設定為相對路徑，否則打包後的桌面版會找不到資源
  base: './'
});
