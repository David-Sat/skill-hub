import fs from 'node:fs';
import path from 'node:path';
import { createBackup } from './backup.js';

export interface DeleteSkillOptions {
  mainFilePath: string;
  dirPath?: string;
  scope: 'global' | 'workspace' | 'builtin';
}

export async function deleteSkill(options: DeleteSkillOptions): Promise<{ success: boolean; error?: string }> {
  if (options.scope === 'builtin') {
    return { success: false, error: 'Cannot delete built-in harness skills.' };
  }

  if (!fs.existsSync(options.mainFilePath)) {
    return { success: false, error: 'Skill file not found on disk.' };
  }

  try {
    // 1. Create a safety backup in ~/.skill-hub/backups/
    await createBackup(options.mainFilePath);

    // 2. If it's a dedicated skill folder with SKILL.md
    if (options.dirPath && fs.existsSync(options.dirPath)) {
      const base = path.basename(options.mainFilePath);
      if (base === 'SKILL.md' || base === 'skill.md') {
        fs.rmSync(options.dirPath, { recursive: true, force: true });
        return { success: true };
      }
    }

    // 3. Otherwise delete the single rule/instruction file
    fs.unlinkSync(options.mainFilePath);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete skill.' };
  }
}
