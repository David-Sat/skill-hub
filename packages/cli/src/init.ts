import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { detectHarnesses } from '@skill-hub/scanner';
import type { HarnessId } from '@skill-hub/core';

export const SKILL_CONTENT = `---
name: skilldesk
description: Unified Skill & MCP Manager for AI Coding Agents. Use when the user asks to inspect installed skills, audit context token weights, review MCP servers, or check for updates. Also triggered by /skills or /skilldesk.
---

# SkillDesk - Unified Skill & MCP Manager

SkillDesk provides cross-harness visibility and management for all your AI coding agent skills and MCP servers.

## Workflow

When the user asks to inspect skills, check MCPs, audit prompt token costs, or runs \`/skills\` or \`/skilldesk\`:

### 1. Perform a quick audit
Call \`skilldesk_audit\` (or \`skill_hub_audit\`) to inspect installed skills, token metrics, and pending updates:
\`\`\`json
{
  "name": "skilldesk_audit"
}
\`\`\`

### 2. Launch the visual web dashboard
When the user wants to visually explore skills, read instructions, inspect bundled files, or click to update MCPs:
\`\`\`json
{
  "name": "skilldesk_launch_ui"
}
\`\`\`
Tell the user:
"I opened your SkillDesk dashboard at http://127.0.0.1:4350. You can inspect all installed skills, read instructions, view token gauges, and 1-click update outdated MCPs."
`;

export const PLUGIN_MANIFEST = {
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  name: 'skilldesk',
  description: 'Unified Skill & MCP Manager for AI Coding Agents with context token profiling and 1-click updates.',
  version: '0.1.0',
  author: {
    name: 'David Satomi',
    url: 'https://github.com/David-Sat',
  },
  homepage: 'https://github.com/David-Sat/skilldesk',
  repository: 'https://github.com/David-Sat/skilldesk',
  license: 'MIT',
  keywords: ['skills', 'mcp', 'agent-plugin', 'token-profiler', 'developer-tools'],
};

export function getMcpConfig(useGlobalCmd: boolean = true) {
  if (useGlobalCmd) {
    return {
      command: 'skilldesk',
      args: ['mcp'],
    };
  }
  return {
    command: 'npx',
    args: ['-y', 'skilldesk', 'mcp'],
  };
}

export function mergeMcpServer(filePath: string, serverKey: string = 'skilldesk'): boolean {
  try {
    let config: any = { mcpServers: {} };
    if (fs.existsSync(filePath)) {
      try {
        config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (!config.mcpServers) config.mcpServers = {};
      } catch {
        return false;
      }
    }

    config.mcpServers[serverKey] = getMcpConfig();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function writePluginBundle(pluginDir: string): boolean {
  try {
    fs.mkdirSync(path.join(pluginDir, 'skills', 'skilldesk'), { recursive: true });

    // Manifest
    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(PLUGIN_MANIFEST, null, 2) + '\n'
    );

    // MCP config
    fs.writeFileSync(
      path.join(pluginDir, 'mcp_config.json'),
      JSON.stringify({ mcpServers: { skilldesk: getMcpConfig() } }, null, 2) + '\n'
    );

    // Skill
    fs.writeFileSync(
      path.join(pluginDir, 'skills', 'skilldesk', 'SKILL.md'),
      SKILL_CONTENT
    );

    return true;
  } catch {
    return false;
  }
}

export async function runInteractiveInit(autoYes: boolean = false): Promise<void> {
  const harnesses = detectHarnesses();
  const detected = harnesses.filter((h) => h.detected);

  console.log('\n[SkillDesk] Installer\n');

  if (detected.length === 0) {
    console.log('No supported AI agent harnesses were detected in standard locations.');
    return;
  }

  console.log('Detected coding agent harnesses on this machine:');
  detected.forEach((h, idx) => {
    console.log(`  ${idx + 1}. [x] ${h.name}`);
  });
  console.log('');

  let selectedIndices: number[] = [];

  if (autoYes) {
    selectedIndices = detected.map((_, i) => i);
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('Configure skilldesk for detected harnesses? [Y/n] ', resolve);
    });
    rl.close();

    const trimmed = answer.trim().toLowerCase();
    if (trimmed === '' || trimmed === 'y' || trimmed === 'yes') {
      selectedIndices = detected.map((_, i) => i);
    } else {
      console.log('Setup aborted.');
      return;
    }
  }

  const home = os.homedir();

  for (const idx of selectedIndices) {
    const h = detected[idx];
    console.log(`Configuring ${h.name}...`);

    switch (h.id) {
      case 'antigravity': {
        const pluginDir = path.join(home, '.gemini', 'config', 'plugins', 'skilldesk');
        writePluginBundle(pluginDir);
        console.log(`  [OK] Installed Antigravity plugin and /skills into ${pluginDir}`);
        break;
      }
      case 'claude-code': {
        if (h.paths.mcp) {
          mergeMcpServer(h.paths.mcp);
          console.log(`  [OK] Added skilldesk MCP server to ${h.paths.mcp}`);
        }
        break;
      }
      case 'claude-desktop': {
        if (h.paths.mcp) {
          mergeMcpServer(h.paths.mcp);
          console.log(`  [OK] Added skilldesk MCP server to ${h.paths.mcp}`);
        }
        break;
      }
      case 'cursor': {
        const cursorMcp = path.join(home, '.cursor', 'mcp.json');
        mergeMcpServer(cursorMcp);
        console.log(`  [OK] Added skilldesk MCP server to ${cursorMcp}`);
        break;
      }
      case 'windsurf': {
        const windsurfMcp = path.join(home, '.codeium', 'windsurf', 'mcp_config.json');
        mergeMcpServer(windsurfMcp);
        console.log(`  [OK] Added skilldesk MCP server to ${windsurfMcp}`);
        break;
      }
      case 'cline':
      case 'roo-code': {
        if (h.paths.mcp) {
          mergeMcpServer(h.paths.mcp);
          console.log(`  [OK] Added skilldesk MCP server to ${h.paths.mcp}`);
        }
        break;
      }
    }
  }

  console.log('\nSetup complete. You can now launch SkillDesk anytime:');
  console.log('   - Terminal: skilldesk (or skill-desk)');
  console.log('   - Agent:    /skills\n');
}
