import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: resolve('electron/main.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: {
          index: resolve('electron/preload.ts'),
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
        '@shared': resolve('shared'),
      },
    },
    plugins: [
      react(),
      {
        name: 'remove-crossorigin',
        transformIndexHtml(html) {
          return html.replace(/crossorigin/g, '')
        },
      },
    ],
    build: {
      outDir: 'out/renderer',
      modulePreload: false,
    },
  },
})
