import { describe, it, expect } from 'vitest';
import { compareVersions, isNewerVersion } from '../semver.js';
import { updateMcpServerVersion } from '../updater.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('semver', () => {
  it('detects newer versions correctly', () => {
    expect(isNewerVersion('0.1.2', '0.2.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '1.0.1')).toBe(true);
    expect(isNewerVersion('2.0.0', '2.0.0')).toBe(false);
    expect(isNewerVersion('1.5.0', '1.4.9')).toBe(false);
  });

  it('handles prefixes like v and ^', () => {
    expect(compareVersions('v1.0.0', '1.0.0')).toBe(0);
    expect(isNewerVersion('^1.0.0', 'v1.1.0')).toBe(true);
  });
});

describe('updateMcpServerVersion', () => {
  it('updates pinned version in a config file and preserves other content', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-hub-test-'));
    const configPath = path.join(tmpDir, 'mcp.json');

    const initialConfig = {
      mcpServers: {
        supabase: {
          command: 'npx',
          args: ['-y', '@supabase/mcp-server@0.1.2'],
        },
        other: {
          command: 'uvx',
          args: ['some-pkg'],
        },
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));

    const success = await updateMcpServerVersion(configPath, 'supabase', '0.2.0');
    expect(success).toBe(true);

    const updated = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(updated.mcpServers.supabase.args).toEqual(['-y', '@supabase/mcp-server@0.2.0']);
    expect(updated.mcpServers.other.args).toEqual(['some-pkg']);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
