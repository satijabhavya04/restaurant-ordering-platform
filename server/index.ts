import http, { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './backendService';

// Resolve directory paths (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

// MIME types dictionary for static asset delivery
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Determines CORS origin response based on request and FRONTEND_ORIGIN configuration.
 */
function resolveCorsOrigin(requestOrigin?: string): string {
  if (!requestOrigin) return '*';
  const configured = process.env.FRONTEND_ORIGIN;
  if (!configured || configured === '*') return requestOrigin;

  const allowedOrigins = configured.split(',').map((o) => o.trim());
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
  const isVercel = requestOrigin.endsWith('.vercel.app');

  if (allowedOrigins.includes(requestOrigin) || isLocalhost || isVercel) {
    return requestOrigin;
  }
  return allowedOrigins[0] || '*';
}

/**
 * Static file server with SPA (Single Page Application) routing fallback.
 */
function serveFrontend(req: IncomingMessage, res: ServerResponse): void {
  const origin = resolveCorsOrigin(req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // If frontend production build does not exist, serve status fallback page
  if (!fs.existsSync(distDir)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Restaurant Ordering Platform — Standalone Server</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; max-width: 640px; margin: auto; line-height: 1.6; color: #1e293b; background: #f8fafc; }
            .card { background: white; padding: 2rem; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            h1 { font-size: 1.5rem; color: #0f172a; margin-top: 0; }
            code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: monospace; }
            ul { padding-left: 1.25rem; }
            li { margin: 0.5rem 0; }
            a { color: #f97316; font-weight: 600; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">SERVER ONLINE</span>
            <h1>🍽️ Restaurant Ordering Platform Backend</h1>
            <p>The standalone Node HTTP server is running and actively serving API and Realtime SSE traffic.</p>
            <p><strong>Frontend Build Notice:</strong> The static frontend has not been compiled into <code>dist/</code> yet.</p>
            <p>To compile and serve the full Customer, Reception, KDS, and Admin UI from this server, run:</p>
            <p><code>npm run build</code></p>
            <h3>Active Endpoints:</h3>
            <ul>
              <li><a href="/api/state">GET /api/state</a> (Tables, Catalog, and Store Registry)</li>
              <li><a href="/api/events">GET /api/events</a> (Live Realtime Server-Sent Events)</li>
            </ul>
          </div>
        </body>
      </html>
    `);
    return;
  }

  // Parse request path
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  let targetFile = path.join(distDir, pathname);

  // Security guardrail: Prevent directory traversal
  if (!targetFile.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // If path is a directory, check for index.html inside it
  if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
    targetFile = path.join(targetFile, 'index.html');
  }

  // If static file exists, stream it with appropriate content-type and cache policy
  if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(targetFile);

    // Hashed assets in /assets/ can be aggressively cached for 1 year; index.html must revalidate
    if (pathname.startsWith('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(targetFile).pipe(res);
    return;
  }

  // SPA Fallback: Serve dist/index.html for all client-side navigation routes
  const spaFallbackFile = path.join(distDir, 'index.html');
  if (fs.existsSync(spaFallbackFile)) {
    const stat = fs.statSync(spaFallbackFile);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache, must-revalidate',
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(spaFallbackFile).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

// Create native Node HTTP Server
const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    // Disable timeout for long-lived Server-Sent Events (SSE) connections
    if (req.url && req.url.startsWith('/api/events')) {
      req.socket.setTimeout(0);
      req.socket.setNoDelay(true);
      req.socket.setKeepAlive(true);
    }

    // 1. Pass request to authoritative backend router
    const handled = await handleApiRequest(req, res);
    if (handled) {
      return;
    }

    // 2. Fallback to production frontend asset / SPA router
    serveFrontend(req, res);
  } catch (err) {
    console.error('Unhandled Server Exception:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Internal Server Error' }));
    }
  }
});

// Configure server keep-alive timeouts
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Read port and host from environment with production defaults
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`\n============================================================`);
  console.log(`🍽️  RESTAURANT ORDERING PLATFORM — STANDALONE NODE SERVER`);
  console.log(`============================================================`);
  console.log(`Node Runtime:    ${process.version}`);
  console.log(`Environment:     ${process.env.NODE_ENV || 'production'}`);
  console.log(`Server URL:      http://${displayHost}:${PORT}`);
  console.log(`API Health:      http://${displayHost}:${PORT}/api/state`);
  console.log(`Realtime SSE:    http://${displayHost}:${PORT}/api/events`);
  console.log(`Frontend Assets: ${fs.existsSync(distDir) ? 'Serving from dist/' : 'dist/ not built (run npm run build)'}`);
  if (process.env.FRONTEND_ORIGIN) {
    console.log(`CORS Origin:     ${process.env.FRONTEND_ORIGIN}`);
  }
  console.log(`============================================================\n`);
});

// Graceful termination handling for SIGTERM and SIGINT (Container / Cloud Host lifecycle)
const gracefulShutdown = (signal: string) => {
  console.log(`\n[${signal}] Initiating graceful shutdown of restaurant platform server...`);
  server.close(() => {
    console.log('[SHUTDOWN] HTTP server closed gracefully. Process exiting.');
    process.exit(0);
  });

  // Force close after 5 seconds if lingering connections fail to close
  setTimeout(() => {
    console.error('[SHUTDOWN WARNING] Forced termination after 5s timeout.');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
