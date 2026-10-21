import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { scanAll } from '@skill-hub/scanner';
import { checkAllUpdates, updateMcpServerVersion } from '@skill-hub/updater';
import { startServer, openBrowser, type RunningServer } from '@skill-hub/server';

let activeWebServer: RunningServer | null = null;

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'io.github.David-Sat/skill-hub',
    version: '0.1.0',
  });

  // 1. Tool: skill_hub_audit
  server.tool(
    'skill_hub_audit',
    'Provides a comprehensive audit of all active AI agent harnesses, installed skills, context token usage, and available updates.',
    {},
    async () => {
      const scanResult = scanAll();
      const updates = await checkAllUpdates(scanResult.skills, scanResult.mcps);

      const activeHarnesses = scanResult.harnesses.filter((h) => h.detected).map((h) => h.name);
      const heavySkills = scanResult.skills.filter((s) => s.tokens.tier === 'heavy');
      const outdatedMcps = updates.mcps.filter((m) => m.updateInfo.hasUpdate);
      const outdatedSkills = updates.skills.filter((s) => s.status.hasUpdate);

      let summary = `### ⚡ Skill Hub Audit Report\n\n`;
      summary += `* **Active Harnesses (${activeHarnesses.length}):** ${activeHarnesses.join(', ')}\n`;
      summary += `* **Total Installed Skills:** ${scanResult.skills.length}\n`;
      summary += `* **Total Configured MCPs:** ${scanResult.mcps.length}\n`;
      summary += `* **Pending Updates:** ${updates.updatesCount} (${outdatedMcps.length} MCPs, ${outdatedSkills.length} Skills)\n\n`;

      if (heavySkills.length > 0) {
        summary += `#### 🔴 Heavyweight Skills (> 4,000 tokens):\n`;
        for (const s of heavySkills) {
          summary += `* **${s.name}** (${s.harnessId}): ~${s.tokens.estimatedTokens.toLocaleString()} tokens (${s.files.length} bundled files)\n`;
        }
        summary += `\n`;
      }

      if (outdatedMcps.length > 0) {
        summary += `#### 🟡 Available MCP Updates:\n`;
        for (const m of outdatedMcps) {
          summary += `* **${m.name}** (${m.harnessId}): v${m.packageInfo.currentVersion || '?'} → **v${m.updateInfo.latestVersion}**\n`;
        }
        summary += `\n`;
      }

      summary += `Launch the interactive dashboard anytime using the \`skill_hub_launch_ui\` tool or running \`npx skill-hub\` in terminal.\n`;

      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      };
    }
  );

  // 2. Tool: skill_hub_launch_ui
  server.tool(
    'skill_hub_launch_ui',
    'Launches the local Skill Hub web dashboard (http://127.0.0.1:4350) and opens it in the default browser.',
    {
      port: z.number().optional().describe('Port to run the dashboard on (default 4350)'),
    },
    async (args) => {
      const port = args.port || 4350;

      // Check if server is already running on port
      try {
        const checkRes = await fetch(`http://127.0.0.1:${port}/api/scan`, { signal: AbortSignal.timeout(500) });
        if (checkRes.ok) {
          openBrowser(`http://127.0.0.1:${port}`);
          return {
            content: [
              {
                type: 'text',
                text: `Skill Hub dashboard is already active at http://127.0.0.1:${port}. Opened in your browser!`,
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
            type: 'text',
            text: `Skill Hub dashboard launched at ${activeWebServer.url}. Opened in your browser!`,
          },
        ],
      };
    }
  );

  // 3. Tool: skill_hub_list_skills
  server.tool(
    'skill_hub_list_skills',
    'Lists skills installed across harnesses with token metrics and bundled file counts.',
    {
      harness: z.string().optional().describe('Filter by harness: antigravity, claude-code, cursor, windsurf, cline'),
      tier: z.enum(['lean', 'moderate', 'heavy']).optional().describe('Filter by token weight tier'),
    },
    async (args) => {
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
            type: 'text',
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      };
    }
  );

  // 4. Tool: skill_hub_update_mcp
  server.tool(
    'skill_hub_update_mcp',
    'Updates an MCP package version in its configuration file with an automated backup.',
    {
      configFilePath: z.string().describe('Absolute path to the configuration file (e.g. mcp.json)'),
      configKey: z.string().describe('The server key identifier in mcpServers (e.g. supabase)'),
      newVersion: z.string().describe('Target version string to bump to (e.g. 0.2.0)'),
    },
    async (args) => {
      const success = await updateMcpServerVersion(args.configFilePath, args.configKey, args.newVersion);
      if (success) {
        return {
          content: [
            {
              type: 'text',
              text: `Successfully updated MCP server "${args.configKey}" to v${args.newVersion}. Safety backup saved to ~/.skill-hub/backups/`,
            },
          ],
        };
      } else {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Failed to update MCP server "${args.configKey}" in ${args.configFilePath}. Check if file and key exist.`,
            },
          ],
        };
      }
    }
  );

  return server;
}
