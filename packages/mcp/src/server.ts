import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { scanAll } from '@skill-hub/scanner';
import { checkAllUpdates, updateMcpServerVersion } from '@skill-hub/updater';
import { startServer, openBrowser, type RunningServer } from '@skill-hub/server';

let activeWebServer: RunningServer | null = null;

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'io.github.David-Sat/skilldesk',
    version: '0.1.0',
  });

  const auditHandler = async () => {
    const scanResult = scanAll();
    const updates = await checkAllUpdates(scanResult.skills, scanResult.mcps);

    const activeHarnesses = scanResult.harnesses.filter((h) => h.detected).map((h) => h.name);
    const heavySkills = scanResult.skills.filter((s) => s.tokens.tier === 'heavy');
    const outdatedMcps = updates.mcps.filter((m) => m.updateInfo.hasUpdate);
    const outdatedSkills = updates.skills.filter((s) => s.status.hasUpdate);

    let summary = `### SkillDesk Audit Report\n\n`;
    summary += `* **Active Harnesses (${activeHarnesses.length}):** ${activeHarnesses.join(', ')}\n`;
    summary += `* **Total Installed Skills:** ${scanResult.skills.length}\n`;
    summary += `* **Total Configured MCPs:** ${scanResult.mcps.length}\n`;
    summary += `* **Pending Updates:** ${updates.updatesCount} (${outdatedMcps.length} MCPs, ${outdatedSkills.length} Skills)\n\n`;

    if (heavySkills.length > 0) {
      summary += `#### Heavyweight Skills (> 4,000 tokens):\n`;
      for (const s of heavySkills) {
        summary += `* **${s.name}** (${s.harnessId}): ~${s.tokens.estimatedTokens.toLocaleString()} tokens (${s.files.length} bundled files)\n`;
      }
      summary += `\n`;
    }

    if (outdatedMcps.length > 0) {
      summary += `#### Available MCP Updates:\n`;
      for (const m of outdatedMcps) {
        summary += `* **${m.name}** (${m.harnessId}): v${m.packageInfo.currentVersion || '?'} → **v${m.updateInfo.latestVersion}**\n`;
      }
      summary += `\n`;
    }

    summary += `Launch the interactive dashboard anytime using the \`skilldesk_launch_ui\` tool or running \`npx skilldesk\` in terminal.\n`;

    return {
      content: [
        {
          type: 'text' as const,
          text: summary,
        },
      ],
    };
  };

  const launchUiHandler = async (args: { port?: number }) => {
    const port = args.port || 4350;

    // Check if server is already running on port
    try {
      const checkRes = await fetch(`http://127.0.0.1:${port}/api/scan`, { signal: AbortSignal.timeout(500) });
      if (checkRes.ok) {
        openBrowser(`http://127.0.0.1:${port}`);
        return {
          content: [
            {
              type: 'text' as const,
              text: `SkillDesk dashboard is already active at http://127.0.0.1:${port}. Opened in your browser!`,
            },
          ],
        };
      }
    } catch {
      // Not running, proceed to start
    }

    if (!activeWebServer) {
      activeWebServer = await startServer({ port, autoOpen: true });
    } else {
      openBrowser(activeWebServer.url);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `SkillDesk dashboard launched at ${activeWebServer.url}. Opened in your browser!`,
        },
      ],
    };
  };

  const listSkillsHandler = async (args: { harness?: string; tier?: 'lean' | 'moderate' | 'heavy' }) => {
    const scanResult = scanAll();
    let skills = scanResult.skills;

    if (args.harness) {
      skills = skills.filter((s) => s.harnessId === args.harness);
    }
    if (args.tier) {
      skills = skills.filter((s) => s.tokens.tier === args.tier);
    }

    const formatted = skills.map((s) => ({
      id: s.id,
      name: s.name,
      harness: s.harnessId,
      scope: s.scope,
      tokens: s.tokens.estimatedTokens,
      tier: s.tokens.tier,
      filesCount: s.files.length,
      version: s.metadata.version || 'unversioned',
      path: s.mainFilePath,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(formatted, null, 2),
        },
      ],
    };
  };

  const updateMcpHandler = async (args: { configFilePath: string; configKey: string; newVersion: string }) => {
    const success = await updateMcpServerVersion(args.configFilePath, args.configKey, args.newVersion);
    if (success) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Successfully updated MCP server "${args.configKey}" to v${args.newVersion}. Safety backup saved to ~/.skilldesk/backups/`,
          },
        ],
      };
    } else {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to update MCP server "${args.configKey}" in ${args.configFilePath}. Check if file and key exist.`,
          },
        ],
      };
    }
  };

  // Register primary skilldesk_* tools
  server.tool(
    'skilldesk_audit',
    'Provides a comprehensive audit of all active AI agent harnesses, installed skills, context token usage, and available updates.',
    {},
    auditHandler
  );

  server.tool(
    'skilldesk_launch_ui',
    'Launches the local SkillDesk web dashboard (http://127.0.0.1:4350) and opens it in the default browser.',
    {
      port: z.number().optional().describe('Port to run the dashboard on (default 4350)'),
    },
    launchUiHandler
  );

  server.tool(
    'skilldesk_list_skills',
    'Lists skills installed across harnesses with token metrics and bundled file counts.',
    {
      harness: z.string().optional().describe('Filter by harness: antigravity, claude-code, cursor, windsurf, cline'),
      tier: z.enum(['lean', 'moderate', 'heavy']).optional().describe('Filter by token weight tier'),
    },
    listSkillsHandler
  );

  server.tool(
    'skilldesk_update_mcp',
    'Updates an MCP package version in its configuration file with an automated backup.',
    {
      configFilePath: z.string().describe('Absolute path to the configuration file (e.g. mcp.json)'),
      configKey: z.string().describe('The server key identifier in mcpServers (e.g. supabase)'),
      newVersion: z.string().describe('Target version string to bump to (e.g. 0.2.0)'),
    },
    updateMcpHandler
  );

  // Aliases for backward compatibility
  server.tool(
    'skill_hub_audit',
    'Alias for skilldesk_audit: audit of all active harnesses, installed skills, context token usage, and updates.',
    {},
    auditHandler
  );

  server.tool(
    'skill_hub_launch_ui',
    'Alias for skilldesk_launch_ui: launches the local SkillDesk web dashboard.',
    {
      port: z.number().optional().describe('Port to run the dashboard on (default 4350)'),
    },
    launchUiHandler
  );

  server.tool(
    'skill_hub_list_skills',
    'Alias for skilldesk_list_skills: lists installed skills across harnesses.',
    {
      harness: z.string().optional().describe('Filter by harness: antigravity, claude-code, cursor, windsurf, cline'),
      tier: z.enum(['lean', 'moderate', 'heavy']).optional().describe('Filter by token weight tier'),
    },
    listSkillsHandler
  );

  server.tool(
    'skill_hub_update_mcp',
    'Alias for skilldesk_update_mcp: updates an MCP package version.',
    {
      configFilePath: z.string().describe('Absolute path to the configuration file (e.g. mcp.json)'),
      configKey: z.string().describe('The server key identifier in mcpServers (e.g. supabase)'),
      newVersion: z.string().describe('Target version string to bump to (e.g. 0.2.0)'),
    },
    updateMcpHandler
  );

  return server;
}
