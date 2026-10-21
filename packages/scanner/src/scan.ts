import { detectHarnesses, type HarnessDetectionOptions } from './harnesses.js';
import { scanAllSkills, type ScanSkillsOptions } from './skills.js';
import { scanAllMcps, type ScanMcpsOptions } from './mcps.js';
import type { SkillHubScanResult } from '@skill-hub/core';

export interface FullScanOptions extends HarnessDetectionOptions, ScanSkillsOptions, ScanMcpsOptions {}

export function scanAll(options: FullScanOptions = {}): SkillHubScanResult {
  const harnesses = detectHarnesses(options);
  const skills = scanAllSkills(options);
  const mcps = scanAllMcps(options);

  const detectedHarnesses = harnesses.filter((h) => h.detected).length;
  const heavySkillsCount = skills.filter((s) => s.tokens.tier === 'heavy').length;

  return {
    timestamp: new Date().toISOString(),
    harnesses,
    skills,
    mcps,
    summary: {
      totalHarnesses: harnesses.length,
      detectedHarnesses,
      totalSkills: skills.length,
      totalMcps: mcps.length,
      heavySkillsCount,
      updatesAvailableCount: 0, // Computed by the updater
    },
  };
}
