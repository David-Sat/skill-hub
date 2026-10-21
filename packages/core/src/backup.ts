import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export function getSkillHubDataDir(): string {
  const custom = process.env.SKILL_HUB_DATA_DIR;
  if (custom) return custom;
  return path.join(os.homedir(), '.skill-hub');
}

export function getBackupsDir(): string {
  return path.join(getSkillHubDataDir(), 'backups');
}

/**
 * Creates a timestamped backup of the target file in ~/.skill-hub/backups/
 * Returns the absolute path of the created backup file.
 */
export async function createBackup(filePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const backupsDir = getBackupsDir();
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeBase = path.basename(filePath);
    const backupName = `${timestamp}_${safeBase}`;
    const backupPath = path.join(backupsDir, backupName);

    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (err) {
    console.error(`Failed to create backup for ${filePath}:`, err);
    return null;
  }
}

/**
 * Restores a backup file to its target location
 */
export async function restoreBackup(backupPath: string, targetPath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(backupPath)) {
      return false;
    }
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.copyFileSync(backupPath, targetPath);
    return true;
  } catch {
    return false;
  }
}
