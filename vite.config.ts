import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: {
        ignored: ['**/db.json'],
      },
    },
    plugins: [
      react(),
      {
        name: 'json-db-server',
        configureServer(server) {
          server.middlewares.use('/api/db', (req, res, next) => {
            const dbPath = path.resolve(__dirname, 'db.json');

            if (req.method === 'GET') {
              if (fs.existsSync(dbPath)) {
                try {
                  const data = fs.readFileSync(dbPath, 'utf-8');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(data);
                } catch (e) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({}));
                }
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({}));
              }
            } else if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  fs.writeFileSync(dbPath, body);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (e) {
                  console.error('Save error:', e);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to save' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
