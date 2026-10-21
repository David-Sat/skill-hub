import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { HarnessId, McpPackageInfo, McpServerItem } from '@skill-hub/core';

export interface ScanMcpsOptions {
  homeDir?: string;
  workspaceDir?: string;
  platform?: NodeJS.Platform;
}

export function scanAllMcps(options: ScanMcpsOptions = {}): McpServerItem[] {
  const home = options.homeDir || os.homedir();
  const workspace = options.workspaceDir || process.cwd();
  const platform = options.platform || process.platform;
  const mcps: McpServerItem[] = [];
  const seenIds = new Set<string>();

  function addServer(server: McpServerItem | null) {
    if (!server) return;
    if (seenIds.has(server.id)) return;
    seenIds.add(server.id);
    mcps.push(server);
  }

  // 1. Claude Desktop
  let desktopPath = '';
  if (platform === 'darwin') {
    desktopPath = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    desktopPath = path.join(appData, 'Claude', 'claude_desktop_config.json');
  } else {
    desktopPath = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }
  parseMcpConfigFile(desktopPath, 'claude-desktop', 'global', addServer);

  // 2. Claude Code
  const claudeJsonPath = path.join(home, '.claude.json');
  parseMcpConfigFile(claudeJsonPath, 'claude-code', 'global', addServer);

  const claudeHomeMcp = path.join(home, '.claude', 'mcp.json');
  parseMcpConfigFile(claudeHomeMcp, 'claude-code', 'global', addServer);

  const workspaceClaudeMcp = path.join(workspace, '.mcp.json');
  parseMcpConfigFile(workspaceClaudeMcp, 'claude-code', 'workspace', addServer);

  const workspaceClaudePluginMcp = path.join(workspace, '.claude-plugin', '.mcp.json');
  parseMcpConfigFile(workspaceClaudePluginMcp, 'claude-code', 'workspace', addServer);

  // 3. Cursor
  const cursorGlobalMcp = path.join(home, '.cursor', 'mcp.json');
  parseMcpConfigFile(cursorGlobalMcp, 'cursor', 'global', addServer);

  const cursorWorkspaceMcp = path.join(workspace, '.cursor', 'mcp.json');
  parseMcpConfigFile(cursorWorkspaceMcp, 'cursor', 'workspace', addServer);

  // 4. Windsurf
  const windsurfGlobalMcp = path.join(home, '.codeium', 'windsurf', 'mcp_config.json');
  parseMcpConfigFile(windsurfGlobalMcp, 'windsurf', 'global', addServer);

  // 5. Cline & Roo Code
  let vscodeGlobal = '';
  if (platform === 'darwin') {
    vscodeGlobal = path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage');
  } else if (platform === 'win32') {
    vscodeGlobal = path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Code', 'User', 'globalStorage');
  } else {
    vscodeGlobal = path.join(home, '.config', 'Code', 'User', 'globalStorage');
  }

  const clineMcpPath = path.join(vscodeGlobal, 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
  parseMcpConfigFile(clineMcpPath, 'cline', 'global', addServer);

  const rooMcpPath = path.join(vscodeGlobal, 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
  parseMcpConfigFile(rooMcpPath, 'roo-code', 'global', addServer);

  // 6. Antigravity Plugins MCP
  const geminiPluginsDir = path.join(home, '.gemini', 'config', 'plugins');
  if (fs.existsSync(geminiPluginsDir)) {
    try {
      const plugins = fs.readdirSync(geminiPluginsDir, { withFileTypes: true });
      for (const p of plugins) {
        if (p.isDirectory()) {
          const pluginMcp1 = path.join(geminiPluginsDir, p.name, 'mcp_config.json');
          parseMcpConfigFile(pluginMcp1, 'antigravity', 'global', addServer);

          const pluginMcp2 = path.join(geminiPluginsDir, p.name, '.mcp.json');
          parseMcpConfigFile(pluginMcp2, 'antigravity', 'global', addServer);
        }
      }
    } catch {
      // ignore
    }
  }

  return mcps;
}

/**
 * Parses standard MCP JSON files with "mcpServers" (or root object)
 */
export function parseMcpConfigFile(
  filePath: string,
  harnessId: HarnessId,
  scope: 'global' | 'workspace',
  onFound: (server: McpServerItem | null) => void
) {
  if (!fs.existsSync(filePath)) return;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    
    // Most standard configs wrap servers in "mcpServers"
    const serversObj = parsed.mcpServers || parsed;

    if (typeof serversObj !== 'object' || serversObj === null) return;

    for (const [key, conf] of Object.entries(serversObj)) {
      if (typeof conf !== 'object' || conf === null) continue;
      const config = conf as any;

      const command = config.command ? String(config.command) : undefined;
      const url = config.url ? String(config.url) : undefined;

      // Only accept if it is inside an explicit mcpServers block, or has command/url
      if (!parsed.mcpServers && !command && !url) {
        continue;
      }

      // Skip non-server state keys
      if (!command && !url && !config.args && !config.env) {
        continue;
      }

      const args: string[] = Array.isArray(config.args) ? config.args.map(String) : [];
      const env = typeof config.env === 'object' && config.env !== null ? config.env : undefined;
      const transport = url ? (url.includes('sse') ? 'sse' : 'http') : 'stdio';

      const packageInfo = parseMcpPackageInfo(command, args);

      const serverItem: McpServerItem = {
        id: `${harnessId}:${key}`,
        name: key,
        harnessId,
        scope,
        configFilePath: filePath,
        configKey: key,
        transport,
        command,
        args,
        env,
        url,
        packageInfo,
        updateInfo: {
          hasUpdate: false,
        },
      };

      onFound(serverItem);
    }
  } catch {
    // ignore malformed JSON or unreadable files
  }
}

/**
 * Extracts package manager, package name, version, and pinned state from command + args
 */
export function parseMcpPackageInfo(command?: string, args: string[] = []): McpPackageInfo {
  if (!command) {
    return { type: 'unknown', isPinned: false };
  }

  const cmd = command.toLowerCase();

  // 1. NPX / Bunx / Node
  if (cmd === 'npx' || cmd === 'bunx') {
    // Filter out common flags like -y, --yes, --quiet
    const targetArg = args.find((a) => !a.startsWith('-') && a !== 'exec');
    if (targetArg) {
      return parseNpmSpecifier(targetArg);
    }
    return { type: 'npm', isPinned: false };
  }

  // 2. UVX / Pip / Python
  if (cmd === 'uvx' || cmd === 'pip' || cmd === 'pipx') {
    const targetArg = args.find((a) => !a.startsWith('-') && a !== 'install');
    if (targetArg) {
      if (targetArg.includes('==')) {
        const [name, version] = targetArg.split('==');
        return {
          type: 'pypi',
          packageName: name,
          currentVersion: version,
          isPinned: true,
        };
      }
      return {
        type: 'pypi',
        packageName: targetArg,
        isPinned: false,
      };
    }
    return { type: 'pypi', isPinned: false };
  }

  // 3. Docker
  if (cmd === 'docker') {
    const runArgIdx = args.indexOf('run');
    if (runArgIdx !== -1) {
      const imageArg = args.slice(runArgIdx + 1).find((a) => !a.startsWith('-'));
      if (imageArg) {
        const colonIdx = imageArg.lastIndexOf(':');
        if (colonIdx !== -1) {
          const name = imageArg.slice(0, colonIdx);
          const tag = imageArg.slice(colonIdx + 1);
          return {
            type: 'docker',
            packageName: name,
            currentVersion: tag,
            isPinned: tag !== 'latest',
          };
        }
        return {
          type: 'docker',
          packageName: imageArg,
          isPinned: false,
        };
      }
    }
    return { type: 'docker', isPinned: false };
  }

  // 4. Local script (node, python, bash)
  if (cmd === 'node' || cmd === 'python' || cmd === 'python3' || cmd === 'bash' || cmd === 'sh') {
    const fileArg = args.find((a) => a.endsWith('.js') || a.endsWith('.mjs') || a.endsWith('.py') || a.endsWith('.sh'));
    if (fileArg) {
      return {
        type: 'local',
        packageName: path.basename(fileArg),
        isPinned: true,
      };
    }
    return { type: 'local', isPinned: false };
  }

  return { type: 'unknown', isPinned: false };
}

/**
 * Parses npm specifier like `@scope/package@1.2.3` or `my-pkg@^2.0`
 */
export function parseNpmSpecifier(specifier: string): McpPackageInfo {
  let name = specifier;
  let version: string | undefined;
  let isPinned = false;

  if (specifier.startsWith('@')) {
    // Scoped package: @scope/name@version
    const secondAt = specifier.indexOf('@', 1);
    if (secondAt !== -1) {
      name = specifier.slice(0, secondAt);
      version = specifier.slice(secondAt + 1);
      isPinned = version !== 'latest';
    }
  } else {
    // Normal package: name@version
    const firstAt = specifier.indexOf('@');
    if (firstAt !== -1) {
      name = specifier.slice(0, firstAt);
      version = specifier.slice(firstAt + 1);
      isPinned = version !== 'latest';
    }
  }

  return {
    type: 'npm',
    packageName: name,
    currentVersion: version,
    isPinned,
  };
}
