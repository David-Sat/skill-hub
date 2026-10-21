import type { SkillMetadata } from './types.js';

export interface ParsedSkillFile {
  name: string;
  description: string;
  metadata: SkillMetadata;
  content: string;
}

/**
 * Robust zero-dependency YAML frontmatter parser for SKILL.md
 */
export function parseSkillFrontmatter(rawContent: string, defaultName: string = 'Unnamed Skill'): ParsedSkillFile {
  const trimmed = rawContent.trimStart();
  if (!trimmed.startsWith('---')) {
    return {
      name: defaultName,
      description: '',
      metadata: {},
      content: rawContent,
    };
  }

  const endIdx = trimmed.indexOf('\n---', 3);
  if (endIdx === -1) {
    return {
      name: defaultName,
      description: '',
      metadata: {},
      content: rawContent,
    };
  }

  const frontmatterBlock = trimmed.slice(3, endIdx).trim();
  const bodyContent = trimmed.slice(endIdx + 4).trimStart();

  const lines = frontmatterBlock.split('\n');
  const metadata: Record<string, any> = {};
  let currentKey = '';
  let inSubObject = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    // Check for indentation (sub-key)
    const isIndented = line.startsWith('  ') || line.startsWith('\t');
    if (isIndented && currentKey && inSubObject) {
      const colonIdx = trimmedLine.indexOf(':');
      if (colonIdx !== -1) {
        const subKey = trimmedLine.slice(0, colonIdx).trim();
        const subVal = cleanValue(trimmedLine.slice(colonIdx + 1).trim());
        if (typeof metadata[currentKey] === 'object' && metadata[currentKey] !== null) {
          metadata[currentKey][subKey] = subVal;
        }
      }
      continue;
    }

    const colonIdx = trimmedLine.indexOf(':');
    if (colonIdx !== -1) {
      const key = trimmedLine.slice(0, colonIdx).trim();
      const val = trimmedLine.slice(colonIdx + 1).trim();

      if (val === '') {
        // Starts a sub-object
        currentKey = key;
        inSubObject = true;
        metadata[key] = {};
      } else {
        currentKey = key;
        inSubObject = false;
        metadata[key] = cleanValue(val);
      }
    }
  }

  const name = metadata.name ? String(metadata.name) : defaultName;
  const description = metadata.description ? String(metadata.description) : '';

  // Extract nested metadata if present
  const fullMetadata: SkillMetadata = {
    ...metadata,
    version: metadata.version || metadata.metadata?.version,
    author: metadata.author || metadata.metadata?.author,
    repository: metadata.repository || metadata.metadata?.source || metadata.metadata?.repository,
    based_on: metadata.based_on || metadata.metadata?.based_on,
    license: metadata.license || metadata.metadata?.license,
  };

  return {
    name,
    description,
    metadata: fullMetadata,
    content: bodyContent,
  };
}

function cleanValue(raw: string): any {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  return raw;
}
