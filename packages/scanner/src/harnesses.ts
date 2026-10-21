import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import type { HarnessId, HarnessInfo } from '@skill-hub/core';

export interface HarnessDetectionOptions {
  homeDir?: string;
  workspaceDir?: string;
  platform?: NodeJS.Platform;
}

function isBinaryOnPath(cmd: string): boolean {
  try {
    const isWindows = process.platform === 'win32';
    const checkCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function detectHarnesses(options: HarnessDetectionOptions = {}): HarnessInfo[] {
  const home = options.homeDir || os.homedir();
  const workspace = options.workspaceDir || process.cwd();
  const platform = options.platform || process.platform;

  const results: HarnessInfo[] = [];

  // 1. Google Antigravity
  const geminiDir = path.join(home, '.gemini');
  const antigravityDetected =
    fs.existsSync(path.join(geminiDir, 'antigravity')) ||
    fs.existsSync(path.join(geminiDir, 'config')) ||
    isBinaryOnPath('agy');

  results.push({
    id: 'antigravity',
    name: 'Google Antigravity',
    detected: antigravityDetected,
    paths: {
      config: geminiDir,
      skills: path.join(geminiDir, 'config', 'skills'),
      plugins: path.join(geminiDir, 'config', 'plugins'),
      mcp: path.join(geminiDir, 'antigravity', 'mcp'),
    },
    icon: 'sparkles',
  });

  // 2. Claude Code
  const claudeDir = path.join(home, '.claude');
  const claudeLocalBin = path.join(home, '.local', 'bin', 'claude');
  const claudeCodeDetected =
    isBinaryOnPath('claude') ||
    fs.existsSync(claudeLocalBin) ||
    fs.existsSync(path.join(claudeDir, 'history.jsonl')) ||
    fs.existsSync(path.join(home, '.claude.json'));

  results.push({
    id: 'claude-code',
    name: 'Claude Code',
    detected: claudeCodeDetected,
    paths: {
      config: fs.existsSync(path.join(home, '.claude.json')) ? path.join(home, '.claude.json') : claudeDir,
      skills: path.join(claudeDir, 'skills'),
      plugins: path.join(claudeDir, 'plugins'),
      mcp: fs.existsSync(path.join(home, '.claude.json')) ? path.join(home, '.claude.json') : path.join(claudeDir, 'mcp.json'),
    },
    icon: 'terminal',
  });

  // 3. Claude Desktop
  let desktopConfigPath = '';
  let desktopDetected = false;
  if (platform === 'darwin') {
    desktopConfigPath = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    desktopDetected =
      fs.existsSync('/Applications/Claude.app') ||
      fs.existsSync(path.join(home, 'Applications', 'Claude.app'));
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    desktopConfigPath = path.join(appData, 'Claude', 'claude_desktop_config.json');
    desktopDetected =
      fs.existsSync(path.join(localAppData, 'Programs', 'Claude', 'Claude.exe')) ||
      fs.existsSync(path.join(appData, 'Claude'));
  } else {
    desktopConfigPath = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
    desktopDetected = isBinaryOnPath('claude-desktop') || fs.existsSync(desktopConfigPath);
  }

  results.push({
    id: 'claude-desktop',
    name: 'Claude Desktop',
    detected: desktopDetected,
    paths: {
      config: desktopConfigPath,
      mcp: desktopConfigPath,
    },
    icon: 'monitor',
  });

  // 4. Cursor
  const cursorGlobal = path.join(home, '.cursor');
  let cursorDetected = false;
  if (platform === 'darwin') {
    cursorDetected =
      fs.existsSync('/Applications/Cursor.app') ||
      fs.existsSync(path.join(home, 'Applications', 'Cursor.app')) ||
      isBinaryOnPath('cursor');
  } else if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    cursorDetected =
      fs.existsSync(path.join(localAppData, 'Programs', 'cursor', 'Cursor.exe')) ||
      isBinaryOnPath('cursor');
  } else {
    cursorDetected = isBinaryOnPath('cursor');
  }

  results.push({
    id: 'cursor',
    name: 'Cursor',
    detected: cursorDetected,
    paths: {
      config: cursorGlobal,
      skills: path.join(cursorGlobal, 'rules'),
      mcp: path.join(cursorGlobal, 'mcp.json'),
    },
    icon: 'code',
  });

  // 5. Windsurf
  const windsurfGlobal = path.join(home, '.codeium', 'windsurf');
  let windsurfDetected = false;
  if (platform === 'darwin') {
    windsurfDetected =
      fs.existsSync('/Applications/Windsurf.app') ||
      fs.existsSync(path.join(home, 'Applications', 'Windsurf.app')) ||
      isBinaryOnPath('windsurf');
  } else if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    windsurfDetected =
      fs.existsSync(path.join(localAppData, 'Programs', 'Windsurf', 'Windsurf.exe')) ||
      isBinaryOnPath('windsurf');
  } else {
    windsurfDetected = isBinaryOnPath('windsurf');
  }

  results.push({
    id: 'windsurf',
    name: 'Windsurf',
    detected: windsurfDetected,
    paths: {
      config: windsurfGlobal,
      skills: path.join(windsurfGlobal, 'rules'),
      mcp: path.join(windsurfGlobal, 'mcp_config.json'),
    },
    icon: 'wind',
  });

  // Check VS Code extension directory for Cline and Roo Code
  const vscodeExts = path.join(home, '.vscode', 'extensions');
  let hasClineExtension = false;
  let hasRooExtension = false;
  if (fs.existsSync(vscodeExts)) {
    try {
      const exts = fs.readdirSync(vscodeExts);
      hasClineExtension = exts.some((e) => e.startsWith('saoudrizwan.claude-dev'));
      hasRooExtension = exts.some((e) => e.startsWith('rooveterinaryinc.roo-cline'));
    } catch {
      // ignore
    }
  }

  // 6. Cline
  let vscodeGlobal = '';
  if (platform === 'darwin') {
    vscodeGlobal = path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage');
  } else if (platform === 'win32') {
    vscodeGlobal = path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Code', 'User', 'globalStorage');
  } else {
    vscodeGlobal = path.join(home, '.config', 'Code', 'User', 'globalStorage');
  }

  const clineDir = path.join(vscodeGlobal, 'saoudrizwan.claude-dev');
  const clineDetected = hasClineExtension;

  results.push({
    id: 'cline',
    name: 'Cline',
    detected: clineDetected,
    paths: {
      config: clineDir,
      mcp: path.join(clineDir, 'settings', 'cline_mcp_settings.json'),
    },
    icon: 'bot',
  });

  // 7. Roo Code
  const rooDir = path.join(vscodeGlobal, 'rooveterinaryinc.roo-cline');
  const rooDetected = hasRooExtension;

  results.push({
    id: 'roo-code',
    name: 'Roo Code',
    detected: rooDetected,
    paths: {
      config: rooDir,
      mcp: path.join(rooDir, 'settings', 'cline_mcp_settings.json'),
    },
    icon: 'cpu',
  });

  return results;
}
