#!/usr/bin/env node
import { Command } from 'commander';
import { startServer, openBrowser } from '@skill-hub/server';
import { scanAll } from '@skill-hub/scanner';
import { checkAllUpdates } from '@skill-hub/updater';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from '@skill-hub/mcp';
import { runInteractiveInit } from './init.js';

const program = new Command();

program
  .name('skill-hub')
  .description('Unified Skill & MCP Manager for AI Coding Agents')
  .version('0.1.0');

// Default action: Start server & open UI
program
  .command('open', { isDefault: true })
  .description('Start the local Skill Hub web dashboard and open it in your browser')
  .option('-p, --port <number>', 'Port to run on', '4350')
  .option('--no-open', 'Do not automatically open the browser')
  .action(async (options) => {
    const port = parseInt(options.port, 10) || 4350;
    console.log('\n( ಠ_ಠ ) Skill Hub • Starting server on 127.0.0.1...');

    try {
      const running = await startServer({
        port,
        autoOpen: options.open !== false,
      });

      console.log(`( ಠ_ಠ ) Skill Hub is active at: ${running.url}`);
      console.log('Press Ctrl+C to stop the server.\n');

      process.on('SIGINT', async () => {
        console.log('\nStopping Skill Hub...');
        await running.close();
        process.exit(0);
      });
    } catch (err: any) {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    }
  });

// Audit command: Quick terminal overview
program
  .command('audit')
  .description('Run a fast CLI scan of installed agent harnesses, skills, and MCPs')
  .option('--check-updates', 'Query registries for available updates', false)
  .action(async (options) => {
    console.log('\n( ಠ_ಠ ) Skill Hub • Scanning installed AI agent harnesses...\n');
    const scanResult = scanAll();

    const activeHarnesses = scanResult.harnesses.filter((h) => h.detected);

    console.log(`Active Harnesses (${activeHarnesses.length}):`);
    activeHarnesses.forEach((h) => console.log(`  - ${h.name}`));
    console.log('');

    console.log(`Installed Skills: ${scanResult.skills.length}`);
    const heavySkills = scanResult.skills.filter((s) => s.tokens.tier === 'heavy');
    if (heavySkills.length > 0) {
      console.log(`  Heavyweight (>4,000 tokens): ${heavySkills.length}`);
      heavySkills.slice(0, 5).forEach((s) => {
        console.log(`     - ${s.name} (${s.harnessId}): ~${s.tokens.estimatedTokens} tokens`);
      });
    }
    console.log('');

    console.log(`Configured MCP Servers: ${scanResult.mcps.length}`);
    scanResult.mcps.slice(0, 6).forEach((m) => {
      console.log(`  - ${m.name} (${m.harnessId}): ${m.command || m.url || 'stdio'}`);
    });
    console.log('');

    if (options.checkUpdates) {
      console.log('Checking for updates across NPM, PyPI, and GitHub...');
      const updates = await checkAllUpdates(scanResult.skills, scanResult.mcps);
      console.log(`Pending Updates: ${updates.updatesCount}`);
      updates.mcps
        .filter((m) => m.updateInfo.hasUpdate)
        .forEach((m) => {
          console.log(`  [Update] MCP ${m.name} (${m.harnessId}): v${m.packageInfo.currentVersion} -> v${m.updateInfo.latestVersion}`);
        });
    }

    console.log('\nRun "npx skill-hub" to launch the interactive visual explorer.\n');
  });

// MCP command: Run stdio MCP server
program
  .command('mcp')
  .description('Run the Skill Hub Model Context Protocol (MCP) server over stdio')
  .action(async () => {
    const mcpServer = createMcpServer();
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
  });

// Init command: Cross-agent setup
program
  .command('init')
  .description('Configure Skill Hub into detected coding agents')
  .option('-g, --global', 'Configure global agent configs')
  .option('-y, --yes', 'Automatically configure all detected agents without prompting')
  .action(async (options) => {
    await runInteractiveInit(Boolean(options.yes));
  });

program.parse(process.argv);
