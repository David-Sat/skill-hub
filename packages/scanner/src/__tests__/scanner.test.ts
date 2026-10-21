import { describe, it, expect } from 'vitest';
import { parseNpmSpecifier, parseMcpPackageInfo } from '../mcps.js';
import { detectHarnesses } from '../harnesses.js';

describe('mcps parser', () => {
  it('parses unpinned npm package', () => {
    const info = parseNpmSpecifier('@modelcontextprotocol/server-filesystem');
    expect(info.type).toBe('npm');
    expect(info.packageName).toBe('@modelcontextprotocol/server-filesystem');
    expect(info.currentVersion).toBeUndefined();
    expect(info.isPinned).toBe(false);
  });

  it('parses pinned scoped npm package', () => {
    const info = parseNpmSpecifier('@supabase/mcp-server@0.1.2');
    expect(info.type).toBe('npm');
    expect(info.packageName).toBe('@supabase/mcp-server');
    expect(info.currentVersion).toBe('0.1.2');
    expect(info.isPinned).toBe(true);
  });

  it('parses npx command args', () => {
    const info = parseMcpPackageInfo('npx', ['-y', '@supabase/mcp-server@0.1.2']);
    expect(info.type).toBe('npm');
    expect(info.packageName).toBe('@supabase/mcp-server');
    expect(info.currentVersion).toBe('0.1.2');
    expect(info.isPinned).toBe(true);
  });

  it('parses uvx command args', () => {
    const info = parseMcpPackageInfo('uvx', ['mcp-server-git==1.0.0']);
    expect(info.type).toBe('pypi');
    expect(info.packageName).toBe('mcp-server-git');
    expect(info.currentVersion).toBe('1.0.0');
    expect(info.isPinned).toBe(true);
  });

  it('parses docker command args', () => {
    const info = parseMcpPackageInfo('docker', ['run', '-i', '--rm', 'ghcr.io/github/github-mcp:v1.2.0']);
    expect(info.type).toBe('docker');
    expect(info.packageName).toBe('ghcr.io/github/github-mcp');
    expect(info.currentVersion).toBe('v1.2.0');
    expect(info.isPinned).toBe(true);
  });
});

describe('harness detection', () => {
  it('returns known harness list', () => {
    const harnesses = detectHarnesses();
    const ids = harnesses.map((h) => h.id);
    expect(ids).toContain('antigravity');
    expect(ids).toContain('claude-code');
    expect(ids).toContain('cursor');
    expect(ids).toContain('windsurf');
    expect(ids).toContain('cline');
  });
});
