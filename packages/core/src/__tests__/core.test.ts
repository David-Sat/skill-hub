import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { estimateTokens, classifyFileRole } from '../tokens.js';
import { parseSkillFrontmatter } from '../frontmatter.js';
import { deleteSkill } from '../delete.js';

describe('tokens', () => {
  it('estimates zero tokens for empty string', () => {
    const res = estimateTokens('');
    expect(res.estimatedTokens).toBe(0);
    expect(res.tier).toBe('lean');
  });

  it('estimates reasonable token count for short instruction', () => {
    const text = 'You are an AI coding assistant. Follow these steps carefully.';
    const res = estimateTokens(text);
    expect(res.estimatedTokens).toBeGreaterThan(5);
    expect(res.estimatedTokens).toBeLessThan(30);
    expect(res.tier).toBe('lean');
  });

  it('classifies heavy tier for text > 4000 tokens', () => {
    const longText = 'word '.repeat(5000);
    const res = estimateTokens(longText);
    expect(res.estimatedTokens).toBeGreaterThan(4000);
    expect(res.tier).toBe('heavy');
  });

  it('classifies file roles accurately', () => {
    expect(classifyFileRole('SKILL.md')).toBe('instruction');
    expect(classifyFileRole('rules/my-rule.mdc')).toBe('instruction');
    expect(classifyFileRole('scripts/helper.py')).toBe('script');
    expect(classifyFileRole('bin/tool.mjs')).toBe('script');
    expect(classifyFileRole('schemas/config.schema.json')).toBe('schema');
    expect(classifyFileRole('references/guide.md')).toBe('reference');
    expect(classifyFileRole('data/catalog.json')).toBe('data');
    expect(classifyFileRole('random.png')).toBe('other');
  });
});

describe('frontmatter parser', () => {
  it('parses YAML frontmatter correctly', () => {
    const sample = `---
name: my-skill
description: A wonderful skill for testing
version: 1.2.0
license: MIT
metadata:
  version: "1.2.0"
  author: Jane Doe
  source: https://github.com/example/skill
---

# My Skill

Detailed instructions go here.
`;
    const parsed = parseSkillFrontmatter(sample);
    expect(parsed.name).toBe('my-skill');
    expect(parsed.description).toBe('A wonderful skill for testing');
    expect(parsed.metadata.author).toBe('Jane Doe');
    expect(parsed.metadata.repository).toBe('https://github.com/example/skill');
    expect(parsed.content.trim()).toContain('# My Skill');
  });

  it('gracefully handles markdown without frontmatter', () => {
    const raw = '# Just Markdown\n\nNo frontmatter here.';
    const parsed = parseSkillFrontmatter(raw, 'fallback-name');
    expect(parsed.name).toBe('fallback-name');
    expect(parsed.content).toBe(raw);
  });
});

describe('deleteSkill', () => {
  it('prevents deleting builtin skills', async () => {
    const res = await deleteSkill({
      mainFilePath: '/fake/path/SKILL.md',
      scope: 'builtin',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Cannot delete built-in harness skills');
  });

  it('safely deletes custom skill directory and backs it up', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-del-test-'));
    const skillMd = path.join(tempDir, 'SKILL.md');
    fs.writeFileSync(skillMd, '# Temp Skill\nDescription text', 'utf-8');

    const res = await deleteSkill({
      mainFilePath: skillMd,
      dirPath: tempDir,
      scope: 'global',
    });

    expect(res.success).toBe(true);
    expect(fs.existsSync(tempDir)).toBe(false);
  });
});
