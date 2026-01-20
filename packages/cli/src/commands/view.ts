/**
 * View command - starts local server with web visualization
 */

import { join, resolve, extname } from 'path';
import { existsSync, readFileSync } from 'fs';
import { createFileStorage } from '../lib/storage';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

export async function view(): Promise<void> {
  const storage = createFileStorage();

  if (!storage.isInitialized()) {
    console.error('Error: Mental model not initialized');
    console.error('Run `mental add domain <name>` to create your first entity');
    process.exit(1);
  }

  const PORT = 3000;
  // Resolve from project root
  const projectRoot = resolve(import.meta.dir, '../../../../');
  const webDistPath = join(projectRoot, 'packages/web/dist');

  // Check if web dist exists
  if (!existsSync(webDistPath)) {
    console.error('Error: Web app not built');
    console.error('Run `bun run build` in packages/web to build the web app');
    process.exit(1);
  }

  const server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);

      // API: Get mental model
      if (url.pathname === '/api/model') {
        const model = storage.readModel();
        return new Response(JSON.stringify(model), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // API: Get file contents
      if (url.pathname === '/api/file') {
        const filePath = url.searchParams.get('path');
        if (!filePath) {
          return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Security: Resolve path and ensure it's within cwd
        const cwd = process.cwd();
        const absolutePath = resolve(cwd, filePath);
        if (!absolutePath.startsWith(cwd)) {
          return new Response(JSON.stringify({ error: 'Invalid path' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (!existsSync(absolutePath)) {
          return new Response(JSON.stringify({ error: 'File not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        try {
          const content = readFileSync(absolutePath, 'utf-8');
          const ext = extname(absolutePath);
          const languageMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'tsx',
            '.js': 'javascript',
            '.jsx': 'jsx',
            '.py': 'python',
            '.go': 'go',
            '.rs': 'rust',
            '.java': 'java',
            '.rb': 'ruby',
            '.php': 'php',
            '.c': 'c',
            '.cpp': 'cpp',
            '.cs': 'csharp',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.html': 'html',
            '.css': 'css',
            '.sql': 'sql',
          };

          return new Response(
            JSON.stringify({
              content,
              language: languageMap[ext] || 'plaintext',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to read file' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // Serve static files from web/dist
      let pathname = url.pathname;
      if (pathname === '/') {
        pathname = '/index.html';
      }

      const filePath = join(webDistPath, pathname);

      // Security: Ensure file is within dist directory
      if (!filePath.startsWith(webDistPath)) {
        return new Response('Forbidden', { status: 403 });
      }

      if (!existsSync(filePath)) {
        // For client-side routing, return index.html
        const indexPath = join(webDistPath, 'index.html');
        if (existsSync(indexPath)) {
          const file = Bun.file(indexPath);
          return new Response(file, {
            headers: { 'Content-Type': 'text/html' },
          });
        }
        return new Response('Not Found', { status: 404 });
      }

      const file = Bun.file(filePath);
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      return new Response(file, {
        headers: { 'Content-Type': contentType },
      });
    },
  });

  console.log(`\nMental Model visualization running at http://localhost:${PORT}\n`);
  console.log('Press Ctrl+C to stop\n');

  // Auto-open browser
  const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  Bun.spawn([open, `http://localhost:${PORT}`]);
}
