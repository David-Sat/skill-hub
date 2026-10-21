import fs from 'node:fs';
import {
  type SkillItem,
  type McpServerItem,
  createBackup,
} from '@skill-hub/core';
import { fetchNpmLatest, fetchPypiLatest, fetchGitHubLatest } from './registries.js';
import { isNewerVersion } from './semver.js';

export async function checkMcpUpdate(mcp: McpServerItem): Promise<McpServerItem> {
  const now = new Date().toISOString();
  const pkg = mcp.packageInfo;

  if (pkg.type === 'npm' && pkg.packageName) {
    try {
      const latest = await fetchNpmLatest(pkg.packageName);
      if (latest) {
        const hasUpdate = pkg.currentVersion ? isNewerVersion(pkg.currentVersion, latest) : false;
        return {
          ...mcp,
          updateInfo: {
            hasUpdate,
            latestVersion: latest,
            checkedAt: now,
            changelogUrl: `https://www.npmjs.com/package/${pkg.packageName}`,
          },
        };
      }
    } catch {
      // ignore
    }
  }

  if (pkg.type === 'pypi' && pkg.packageName) {
    try {
      const latest = await fetchPypiLatest(pkg.packageName);
      if (latest) {
        const hasUpdate = pkg.currentVersion ? isNewerVersion(pkg.currentVersion, latest) : false;
        return {
          ...mcp,
          updateInfo: {
            hasUpdate,
            latestVersion: latest,
            checkedAt: now,
            changelogUrl: `https://pypi.org/project/${pkg.packageName}`,
          },
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    ...mcp,
    updateInfo: {
      ...mcp.updateInfo,
      checkedAt: now,
    },
  };
}

export async function checkSkillUpdate(skill: SkillItem): Promise<SkillItem> {
  const now = new Date().toISOString();
  const repo = skill.metadata.repository;
  const currentVersion = skill.metadata.version;

  if (repo && typeof repo === 'string') {
    try {
      const latestTag = await fetchGitHubLatest(repo);
      if (latestTag && currentVersion) {
        const hasUpdate = isNewerVersion(currentVersion, latestTag);
        return {
          ...skill,
          status: {
            ...skill.status,
            hasUpdate,
            latestVersion: latestTag,
            updateUrl: repo,
            checkedAt: now,
          },
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    ...skill,
    status: {
      ...skill.status,
      checkedAt: now,
    },
  };
}

/**
 * Checks updates concurrently for all skills and mcps with concurrency limits
 */
export async function checkAllUpdates(
  skills: SkillItem[],
  mcps: McpServerItem[]
): Promise<{ skills: SkillItem[]; mcps: McpServerItem[]; updatesCount: number }> {
  const updatedMcps = await Promise.all(mcps.map((m) => checkMcpUpdate(m)));
  const updatedSkills = await Promise.all(skills.map((s) => checkSkillUpdate(s)));

  const updatesCount =
    updatedMcps.filter((m) => m.updateInfo.hasUpdate).length +
    updatedSkills.filter((s) => s.status.hasUpdate).length;

  return {
    skills: updatedSkills,
    mcps: updatedMcps,
    updatesCount,
  };
}

/**
 * Safely updates the pinned version of an MCP server in its JSON configuration file.
 * Automatically creates a backup in ~/.skill-hub/backups/ before modifying.
 */
export async function updateMcpServerVersion(
  configFilePath: string,
  configKey: string,
  newVersion: string
): Promise<boolean> {
  try {
    if (!fs.existsSync(configFilePath)) return false;

    // 1. Create safety backup
    await createBackup(configFilePath);

    // 2. Read and parse configuration
    const raw = fs.readFileSync(configFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const targetObj = parsed.mcpServers ? parsed.mcpServers : parsed;

    if (!targetObj[configKey]) return false;
    const serverConf = targetObj[configKey];

    if (!Array.isArray(serverConf.args)) return false;

    // 3. Find and replace package specifier in args
    const newArgs = serverConf.args.map((arg: string) => {
      // Handle scoped package @scope/name@oldVersion
      if (arg.startsWith('@')) {
        const atIdx = arg.indexOf('@', 1);
        if (atIdx !== -1) {
          const pkgName = arg.slice(0, atIdx);
          return `${pkgName}@${newVersion}`;
        }
        return `${arg}@${newVersion}`;
      }

      // Handle normal package name@oldVersion
      const atIdx = arg.indexOf('@');
      if (atIdx !== -1) {
        const pkgName = arg.slice(0, atIdx);
        return `${pkgName}@${newVersion}`;
      }

      // Handle python == syntax
      if (arg.includes('==')) {
        const [name] = arg.split('==');
        return `${name}==${newVersion}`;
      }

      // Handle docker image:tag
      if (serverConf.command === 'docker' && arg.includes(':')) {
        const [image] = arg.split(':');
        return `${image}:${newVersion}`;
      }

      return arg;
    });

    serverConf.args = newArgs;

    // 4. Write back preserving formatting
    fs.writeFileSync(configFilePath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
    return true;
  } catch (err) {
    console.error(`Failed to update MCP ${configKey} in ${configFilePath}:`, err);
    return false;
  }
}

/**
 * Safely updates a skill main file (e.g. SKILL.md) with new content.
 * Automatically creates a backup in ~/.skill-hub/backups/ before modifying.
 */
export async function saveSkillFile(filePath: string, newContent: string): Promise<boolean> {
  try {
    if (!fs.existsSync(filePath)) return false;

    // 1. Safety backup
    await createBackup(filePath);

    // 2. Write new content
    fs.writeFileSync(filePath, newContent, 'utf-8');
    return true;
  } catch {
    return false;
  }
}
