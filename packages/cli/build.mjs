import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bundle() {
  const distDir = path.resolve(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Bundle CLI executable (inlines @skill-hub/* internal packages)
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/cli.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    external: ['commander', '@modelcontextprotocol/sdk'],
    outfile: path.resolve(distDir, 'cli.js'),
  });

  // Ensure executable permission
  try {
    fs.chmodSync(path.resolve(distDir, 'cli.js'), 0o755);
  } catch {}

  // 2. Bundle programmatic entry
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    external: ['commander', '@modelcontextprotocol/sdk'],
    outfile: path.resolve(distDir, 'index.js'),
  });

  // 3. Copy UI dist to dist/ui
  const uiSrc = path.resolve(__dirname, '../ui/dist');
  const uiDest = path.resolve(distDir, 'ui');
  if (fs.existsSync(uiSrc)) {
    fs.cpSync(uiSrc, uiDest, { recursive: true });
    console.log('[skilldesk] Embedded UI dist into packages/cli/dist/ui');
  }

  // 4. Sync root README and LICENSE for NPM publishing
  const rootReadme = path.resolve(__dirname, '../../README.md');
  const rootLicense = path.resolve(__dirname, '../../LICENSE');
  if (fs.existsSync(rootReadme)) {
    fs.copyFileSync(rootReadme, path.resolve(__dirname, 'README.md'));
  }
  if (fs.existsSync(rootLicense)) {
    fs.copyFileSync(rootLicense, path.resolve(__dirname, 'LICENSE'));
  }

  console.log('[skilldesk] Successfully bundled CLI & MCP distribution.');
}

bundle().catch((err) => {
  console.error('[skilldesk] Build failed:', err);
  process.exit(1);
});
