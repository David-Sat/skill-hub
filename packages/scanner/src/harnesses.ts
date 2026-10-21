import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { HarnessId, HarnessInfo } from '@skill-hub/core';

export interface HarnessDetectionOptions {
  homeDir?: string;
  workspaceDir?: string;
  platform?: NodeJS.Platform;
}

export function detectHarnesses(options: HarnessDetectionOptions = {}): HarnessInfo[] {
  const home = options.homeDir || os.homedir();
  const workspace = options.workspaceDir || process.cwd();
  const platform = options.platform || process.platform;

  const results: HarnessInfo[] = [];

  // 1. Google Antigravity
  const geminiDir = path.join(home, '.gemini');
  const antigravityDetected = fs.existsSync(geminiDir);
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
  const claudeJson = path.join(home, '.claude.json');
  const claudeCodeDetected = fs.existsSync(claudeDir) || fs.existsSync(claudeJson);
  results.push({
    id: 'claude-code',
    name: 'Claude Code',
    detected: claudeCodeDetected,
    paths: {
      config: fs.existsSync(claudeJson) ? claudeJson : claudeDir,
      skills: path.join(claudeDir, 'skills'),
      plugins: path.join(claudeDir, 'plugins'),
      mcp: fs.existsSync(claudeJson) ? claudeJson : path.join(claudeDir, 'mcp.json'),
    },
    icon: 'terminal',
  });

  // 3. Claude Desktop
  let desktopConfigPath = '';
  let desktopDetected = false;
  if (platform === 'darwin') {
    desktopConfigPath = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    desktopDetected = fs.existsSync(desktopConfigPath) || fs.existsSync('/Applications/Claude.app');
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    desktopConfigPath = path.join(appData, 'Claude', 'claude_desktop_config.json');
    desktopDetected = fs.existsSync(desktopConfigPath);
  } else {
    desktopConfigPath = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
    desktopDetected = fs.existsSync(desktopConfigPath);
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
  let cursorDetected = fs.existsSync(cursorGlobal);
  if (!cursorDetected && platform === 'darwin') {
    cursorDetected = fs.existsSync('/Applications/Cursor.app');
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
  let windsurfDetected = fs.existsSync(windsurfGlobal);
  if (!windsurfDetected && platform === 'darwin') {
    windsurfDetected = fs.existsSync('/Applications/Windsurf.app');
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
  const clineDetected = fs.existsSync(clineDir);
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
  const rooDetected = fs.existsSync(rooDir);
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
