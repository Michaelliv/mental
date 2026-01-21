import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Environment variables for static build:
// - VITE_BASE_PATH: Base path for GitHub Pages (e.g., /repo-name/)
// - MENTAL_STATIC_BUILD: Set to 'true' for static site generation

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.html': 'html',
  '.css': 'css',
};

// Project root (where .mental folder lives)
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const MODEL_PATH = path.join(PROJECT_ROOT, '.mental/model.ndjson');

// Inline NDJSON parser (same as @mentalmodel/shared)
function parseNDJSON(content: string) {
  const lines = content.trim().split('\n').filter(Boolean);
  const domains: Record<string, unknown> = {};
  const capabilities: Record<string, unknown> = {};
  const aspects: Record<string, unknown> = {};
  const decisions: Record<string, unknown> = {};
  let lastUpdated = new Date(0).toISOString();

  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (record.timestamp > lastUpdated) lastUpdated = record.timestamp;
      const { type, ...entity } = record;
      if (type === 'domain') {
        if (entity.deleted) delete domains[entity.name];
        else domains[entity.name] = entity;
      } else if (type === 'capability') {
        if (entity.deleted) delete capabilities[entity.name];
        else capabilities[entity.name] = entity;
      } else if (type === 'aspect') {
        if (entity.deleted) delete aspects[entity.name];
        else aspects[entity.name] = entity;
      } else if (type === 'decision') {
        if (entity.deleted) delete decisions[entity.id];
        else decisions[entity.id] = entity;
      }
    } catch {}
  }

  return { domains, capabilities, aspects, decisions, version: '0.1.0', lastUpdated };
}

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  // Base path for GitHub Pages (e.g., /repo-name/)
  const basePath = env.VITE_BASE_PATH || '/';

  return {
    base: basePath,
    plugins: [
      react(),
      // Dev API plugin - reads actual .mental/model.ndjson
      {
        name: 'dev-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/model') {
              if (!fs.existsSync(MODEL_PATH)) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'No .mental/model.ndjson found' }));
                return;
              }
              const content = fs.readFileSync(MODEL_PATH, 'utf-8');
              const model = parseNDJSON(content);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(model));
              return;
            }
            if (req.url?.startsWith('/api/file')) {
              const url = new URL(req.url, 'http://localhost');
              const filePath = url.searchParams.get('path');

              if (!filePath) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing path parameter' }));
                return;
              }

              // Resolve relative to project root
              const absolutePath = path.resolve(PROJECT_ROOT, filePath);

              // Security: ensure within project root
              if (!absolutePath.startsWith(PROJECT_ROOT)) {
                res.statusCode = 403;
                res.end(JSON.stringify({ error: 'Invalid path' }));
                return;
              }

              if (!fs.existsSync(absolutePath)) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'File not found' }));
                return;
              }

              const content = fs.readFileSync(absolutePath, 'utf-8');
              const ext = path.extname(absolutePath);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                content,
                language: LANGUAGE_MAP[ext] || 'plaintext',
              }));
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3001, // Dev server port (production uses Bun on 3000)
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
