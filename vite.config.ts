import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';

// Helper to load Firebase Config
function loadFirebaseConfig() {
  if (process.env.FIREBASE_CONFIG_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_CONFIG_JSON);
    } catch (e) {
      console.error("Failed to parse FIREBASE_CONFIG_JSON env var:", e);
    }
  }

  const secretPath = path.resolve(process.cwd(), 'secrets/firebaseConfig.json');
  try {
    if (fs.existsSync(secretPath)) {
      const data = fs.readFileSync(secretPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read local secrets file:", e);
  }

  return null;
}

const firebaseConfig = loadFirebaseConfig();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use VITE_BASE_PATH for GitHub Pages (/speaknative/), default to / for Firebase Hosting
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    __FIREBASE_CONFIG__: JSON.stringify(firebaseConfig)
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
