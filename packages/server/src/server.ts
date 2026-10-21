import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { deleteSkill } from '@skill-hub/core';
import { scanAll } from '@skill-hub/scanner';
import { checkAllUpdates, updateMcpServerVersion, saveSkillFile } from '@skill-hub/updater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerOptions {
  port?: number;
  host?: string;
  autoOpen?: boolean;
  uiDistDir?: string;
}

export interface RunningServer {
  server: http.Server;
  port: number;
  url: string;
  close: () => Promise<void>;
}

export async function startServer(options: ServerOptions = {}): Promise<RunningServer> {
  const host = options.host || '127.0.0.1';
  let targetPort = options.port || 4350;

  // Resolve ui/dist directory
  let uiDistDir = options.uiDistDir;
  if (!uiDistDir) {
    const candidatePaths = [
      path.resolve(__dirname, '../../ui/dist'),
      path.resolve(__dirname, '../ui/dist'),
      path.resolve(process.cwd(), 'packages/ui/dist'),
      path.resolve(__dirname, '../../../packages/ui/dist'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        uiDistDir = p;
        break;
      }
    }
  }

  const server = http.createServer(async (req, res) => {
    // Enable CORS for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${host}:${targetPort}`);
    const pathname = parsedUrl.pathname;

    try {
      // 1. API: Scan
      if (pathname === '/api/scan' && req.method === 'GET') {
        const scanResult = scanAll();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(scanResult));
        return;
      }

      // 2. API: Updates
      if (pathname === '/api/updates' && req.method === 'GET') {
        const scanResult = scanAll();
        const updateResult = await checkAllUpdates(scanResult.skills, scanResult.mcps);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updateResult));
        return;
      }

      // 3. API: Read Skill file content
      if (pathname === '/api/skill' && req.method === 'GET') {
        const filePath = parsedUrl.searchParams.get('path');
        if (!filePath || !fs.existsSync(filePath)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'File not found' }));
          return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ path: filePath, content }));
        return;
      }

      // 4. API: Save Skill file content
      if (pathname === '/api/skill/save' && req.method === 'POST') {
        const body = await readJsonBody(req);
        if (!body.filePath || typeof body.content !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request payload' }));
          return;
        }

        const ok = await saveSkillFile(body.filePath, body.content);
        res.writeHead(ok ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: ok }));
        return;
      }

      // 4b. API: Delete Skill
      if (pathname === '/api/skill/delete' && req.method === 'POST') {
        const body = await readJsonBody(req);
        if (!body.mainFilePath || !body.scope) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing mainFilePath or scope' }));
          return;
        }

        const result = await deleteSkill({
          mainFilePath: body.mainFilePath,
          dirPath: body.dirPath,
          scope: body.scope,
        });

        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      // 5. API: Update MCP server version
      if (pathname === '/api/mcp/update' && req.method === 'POST') {
        const body = await readJsonBody(req);
        if (!body.configFilePath || !body.configKey || !body.newVersion) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required update parameters' }));
          return;
        }

        const ok = await updateMcpServerVersion(body.configFilePath, body.configKey, body.newVersion);
        res.writeHead(ok ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: ok }));
        return;
      }

      // 6. API: Shutdown
      if (pathname === '/api/shutdown' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ shuttingDown: true }));
        setTimeout(() => server.close(), 100);
        return;
      }

      // 7. Static Asset Serving from UI dist
      if (uiDistDir && fs.existsSync(uiDistDir)) {
        let safePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
        let filePath = path.join(uiDistDir, safePath);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(uiDistDir, 'index.html');
        }

        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType = getMimeType(ext);
          const content = fs.readFileSync(filePath);
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
          return;
        }
      }

      // Fallback
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
    }
  });

  const runningPort = await listenOnAvailablePort(server, targetPort, host);
  const url = `http://${host}:${runningPort}`;

  if (options.autoOpen) {
    openBrowser(url);
  }

  return {
    server,
    port: runningPort,
    url,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

function listenOnAvailablePort(server: http.Server, startPort: number, host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let port = startPort;
    const maxAttempts = 10;
    let attempts = 0;

    function tryListen() {
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error(`Unable to bind server: all ports ${startPort}-${port} in use.`));
          } else {
            port++;
            tryListen();
          }
        } else {
          reject(err);
        }
      });

      server.listen(port, host, () => {
        resolve(port);
      });
    }

    tryListen();
  });
}

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function getMimeType(ext: string): string {
  switch (ext) {
    case '.html': return 'text/html';
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.json': return 'application/json';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

export function openBrowser(url: string) {
  const platform = process.platform;
  let cmd = '';
  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  exec(cmd, () => {});
}
