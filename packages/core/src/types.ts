export type HarnessId =
  | 'antigravity'
  | 'claude-code'
  | 'claude-desktop'
  | 'cursor'
  | 'windsurf'
  | 'cline'
  | 'roo-code';

export interface HarnessInfo {
  id: HarnessId;
  name: string;
  detected: boolean;
  version?: string;
  paths: {
    config?: string;
    skills?: string;
    mcp?: string;
    plugins?: string;
  };
  icon?: string;
}

export type TokenTier = 'lean' | 'moderate' | 'heavy';

export interface TokenMetric {
  estimatedTokens: number;
  charCount: number;
  wordCount: number;
  lineCount: number;
  tier: TokenTier;
}

export type FileRole =
  | 'instruction'
  | 'script'
  | 'data'
  | 'schema'
  | 'reference'
  | 'test'
  | 'doc'
  | 'other';

export interface BundledFile {
  relativePath: string;
  absolutePath: string;
  sizeBytes: number;
  role: FileRole;
}

export interface SkillMetadata {
  version?: string;
  author?: string;
  repository?: string;
  based_on?: string;
  license?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  harnessId: HarnessId;
  scope: 'global' | 'workspace' | 'builtin';
  bundle?: string;
  dirPath: string;
  mainFilePath: string;
  metadata: SkillMetadata;
  tokens: TokenMetric;
  files: BundledFile[];
  status: {
    isDirty?: boolean;
    hasUpdate?: boolean;
    latestVersion?: string;
    updateUrl?: string;
    checkedAt?: string;
  };
}

export type McpPackageType = 'npm' | 'pypi' | 'docker' | 'local' | 'unknown';

export interface McpPackageInfo {
  type: McpPackageType;
  packageName?: string;
  currentVersion?: string;
  isPinned: boolean;
}

export interface McpUpdateInfo {
  hasUpdate: boolean;
  latestVersion?: string;
  checkedAt?: string;
  changelogUrl?: string;
  error?: string;
}

export interface McpServerItem {
  id: string;
  name: string;
  harnessId: HarnessId;
  scope: 'global' | 'workspace';
  configFilePath: string;
  configKey: string;
  transport: 'stdio' | 'sse' | 'http';
  command?: string;
  args: string[];
  env?: Record<string, string>;
  url?: string;
  packageInfo: McpPackageInfo;
  updateInfo: McpUpdateInfo;
}

export interface ScanSummary {
  totalHarnesses: number;
  detectedHarnesses: number;
  totalSkills: number;
  totalMcps: number;
  heavySkillsCount: number;
  updatesAvailableCount: number;
}

export interface SkillHubScanResult {
  timestamp: string;
  harnesses: HarnessInfo[];
  skills: SkillItem[];
  mcps: McpServerItem[];
  summary: ScanSummary;
}
