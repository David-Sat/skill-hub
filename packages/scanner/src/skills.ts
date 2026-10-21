import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  type SkillItem,
  type BundledFile,
  type HarnessId,
  estimateTokens,
  classifyFileRole,
  parseSkillFrontmatter,
} from '@skill-hub/core';

export interface ScanSkillsOptions {
  homeDir?: string;
  workspaceDir?: string;
}

export function scanAllSkills(options: ScanSkillsOptions = {}): SkillItem[] {
  const home = options.homeDir || os.homedir();
  const workspace = options.workspaceDir || process.cwd();
  const skills: SkillItem[] = [];
  const seenPaths = new Set<string>();

  function addSkill(item: SkillItem | null) {
    if (!item) return;
    if (seenPaths.has(item.mainFilePath)) return;
    seenPaths.add(item.mainFilePath);
    skills.push(item);
  }

  // 1. Antigravity Skills
  const geminiDir = path.join(home, '.gemini');

  // Antigravity global user skills
  const antigravityUserSkills = path.join(geminiDir, 'config', 'skills');
  scanDirectoryForSkills(antigravityUserSkills, 'antigravity', 'global', addSkill);

  // Antigravity plugin skills
  const antigravityPluginsDir = path.join(geminiDir, 'config', 'plugins');
  if (fs.existsSync(antigravityPluginsDir)) {
    try {
      const plugins = fs.readdirSync(antigravityPluginsDir, { withFileTypes: true });
      for (const p of plugins) {
        if (p.isDirectory()) {
          const pluginSkillDir = path.join(antigravityPluginsDir, p.name, 'skills');
          scanDirectoryForSkills(pluginSkillDir, 'antigravity', 'global', addSkill);
        }
      }
    } catch {
      // ignore read errors
    }
  }

  // Antigravity builtin skills
  const antigravityBuiltinDir = path.join(geminiDir, 'antigravity', 'builtin', 'skills');
  scanDirectoryForSkills(antigravityBuiltinDir, 'antigravity', 'builtin', addSkill);

  // Antigravity workspace skills
  const workspaceGeminiSkills = path.join(workspace, '.gemini', 'skills');
  scanDirectoryForSkills(workspaceGeminiSkills, 'antigravity', 'workspace', addSkill);

  // 2. Claude Code Skills
  const claudeDir = path.join(home, '.claude');
  const claudeUserSkills = path.join(claudeDir, 'skills');
  scanDirectoryForSkills(claudeUserSkills, 'claude-code', 'global', addSkill);

  const claudePluginsDir = path.join(claudeDir, 'plugins');
  if (fs.existsSync(claudePluginsDir)) {
    try {
      const plugins = fs.readdirSync(claudePluginsDir, { withFileTypes: true });
      for (const p of plugins) {
        if (p.isDirectory()) {
          const pluginSkillDir = path.join(claudePluginsDir, p.name, 'skills');
          scanDirectoryForSkills(pluginSkillDir, 'claude-code', 'global', addSkill);
        }
      }
    } catch {
      // ignore
    }
  }

  const workspaceClaudeSkills = path.join(workspace, '.claude', 'skills');
  scanDirectoryForSkills(workspaceClaudeSkills, 'claude-code', 'workspace', addSkill);

  // 3. Cursor Rules & Skills
  const cursorGlobalRules = path.join(home, '.cursor', 'rules');
  scanRulesDirectory(cursorGlobalRules, 'cursor', 'global', addSkill);

  const cursorWorkspaceRules = path.join(workspace, '.cursor', 'rules');
  scanRulesDirectory(cursorWorkspaceRules, 'cursor', 'workspace', addSkill);

  const workspaceCursorRulesFile = path.join(workspace, '.cursorrules');
  if (fs.existsSync(workspaceCursorRulesFile)) {
    addSkill(createSkillFromFile(workspaceCursorRulesFile, 'cursor', 'workspace', '.cursorrules'));
  }

  // 4. Windsurf Rules
  const windsurfGlobalRules = path.join(home, '.codeium', 'windsurf', 'rules');
  scanRulesDirectory(windsurfGlobalRules, 'windsurf', 'global', addSkill);

  const windsurfWorkspaceRules = path.join(workspace, '.windsurf', 'rules');
  scanRulesDirectory(windsurfWorkspaceRules, 'windsurf', 'workspace', addSkill);

  const workspaceWindsurfRulesFile = path.join(workspace, '.windsurfrules');
  if (fs.existsSync(workspaceWindsurfRulesFile)) {
    addSkill(createSkillFromFile(workspaceWindsurfRulesFile, 'windsurf', 'workspace', '.windsurfrules'));
  }

  // 5. Cline / Roo Code Rules
  const workspaceClineRulesFile = path.join(workspace, '.clinerules');
  if (fs.existsSync(workspaceClineRulesFile)) {
    addSkill(createSkillFromFile(workspaceClineRulesFile, 'cline', 'workspace', '.clinerules'));
  }

  const workspaceRooModesFile = path.join(workspace, '.roomodes');
  if (fs.existsSync(workspaceRooModesFile)) {
    addSkill(createSkillFromFile(workspaceRooModesFile, 'roo-code', 'workspace', '.roomodes'));
  }

  return skills;
}

/**
 * Scan a parent directory where each subfolder is a skill containing SKILL.md
 */
function scanDirectoryForSkills(
  parentDir: string,
  harnessId: HarnessId,
  scope: 'global' | 'workspace' | 'builtin',
  onFound: (skill: SkillItem | null) => void
) {
  if (!fs.existsSync(parentDir)) return;
  try {
    const entries = fs.readdirSync(parentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDirPath = path.join(parentDir, entry.name);
        const skillMdPath = path.join(skillDirPath, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
          onFound(createSkillFromDir(skillDirPath, skillMdPath, harnessId, scope, entry.name));
        }
      }
    }
  } catch {
    // ignore directory read errors
  }
}

/**
 * Scan a rules directory containing individual .mdc or .md files
 */
function scanRulesDirectory(
  rulesDir: string,
  harnessId: HarnessId,
  scope: 'global' | 'workspace',
  onFound: (skill: SkillItem | null) => void
) {
  if (!fs.existsSync(rulesDir)) return;
  try {
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.mdc') || entry.name.endsWith('.md'))) {
        const filePath = path.join(rulesDir, entry.name);
        const baseName = path.basename(entry.name, path.extname(entry.name));
        onFound(createSkillFromFile(filePath, harnessId, scope, baseName));
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Create a SkillItem from a directory containing SKILL.md and bundled files
 */
export function createSkillFromDir(
  dirPath: string,
  mainFilePath: string,
  harnessId: HarnessId,
  scope: 'global' | 'workspace' | 'builtin',
  defaultName: string
): SkillItem | null {
  try {
    const content = fs.readFileSync(mainFilePath, 'utf-8');
    const parsed = parseSkillFrontmatter(content, defaultName);
    const tokens = estimateTokens(content);
    const bundledFiles = scanBundledFiles(dirPath, mainFilePath);

    return {
      id: `${harnessId}:${parsed.name || defaultName}`,
      name: parsed.name || defaultName,
      description: parsed.description,
      harnessId,
      scope,
      dirPath,
      mainFilePath,
      metadata: parsed.metadata,
      tokens,
      files: bundledFiles,
      status: {
        latestVersion: parsed.metadata.version,
      },
    };
  } catch (err) {
    return null;
  }
}

/**
 * Create a SkillItem from a standalone rule/prompt file
 */
export function createSkillFromFile(
  filePath: string,
  harnessId: HarnessId,
  scope: 'global' | 'workspace',
  defaultName: string
): SkillItem | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseSkillFrontmatter(content, defaultName);
    const tokens = estimateTokens(content);

    const bundledFiles: BundledFile[] = [
      {
        relativePath: path.basename(filePath),
        absolutePath: filePath,
        sizeBytes: Buffer.byteLength(content, 'utf-8'),
        role: 'instruction',
      },
    ];

    return {
      id: `${harnessId}:${parsed.name || defaultName}`,
      name: parsed.name || defaultName,
      description: parsed.description,
      harnessId,
      scope,
      dirPath: path.dirname(filePath),
      mainFilePath: filePath,
      metadata: parsed.metadata,
      tokens,
      files: bundledFiles,
      status: {
        latestVersion: parsed.metadata.version,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Recursively scans files bundled inside a skill folder (max 3 levels deep)
 */
function scanBundledFiles(dirPath: string, mainFilePath: string, currentDepth: number = 0, baseDir: string = dirPath): BundledFile[] {
  if (currentDepth > 3) return [];
  const results: BundledFile[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...scanBundledFiles(fullPath, mainFilePath, currentDepth + 1, baseDir));
      } else if (entry.isFile()) {
        const stat = fs.statSync(fullPath);
        const relativePath = path.relative(baseDir, fullPath);
        results.push({
          relativePath,
          absolutePath: fullPath,
          sizeBytes: stat.size,
          role: classifyFileRole(relativePath),
        });
      }
    }
  } catch {
    // ignore access errors
  }

  return results;
}
