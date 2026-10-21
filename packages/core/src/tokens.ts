import type { FileRole, TokenMetric, TokenTier } from './types.js';
import path from 'node:path';

/**
 * Fast, accurate token estimator modeled after BPE tokenizers (cl100k / Gemini).
 * Standard English text averages ~4 characters per token.
 * Code, Markdown formatting, YAML frontmatter, and punctuation produce denser tokens (~3.2 - 3.6 chars/token).
 * Numbers, special symbols, and whitespace indentation add token penalties.
 */
export function estimateTokens(text: string): TokenMetric {
  if (!text || text.length === 0) {
    return {
      estimatedTokens: 0,
      charCount: 0,
      wordCount: 0,
      lineCount: 0,
      tier: 'lean',
    };
  }

  const charCount = text.length;
  const lines = text.split('\n');
  const lineCount = lines.length;

  // Count words by non-whitespace sequences
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Token calculation:
  // Base token estimate from words and characters
  // BPE tokenizes compound words, code identifiers, punctuation, and whitespace
  let tokenCount = 0;

  for (const word of words) {
    if (word.length <= 4) {
      tokenCount += 1;
    } else {
      // Subword tokens: roughly 1 token per 3.7 characters for longer words/code
      tokenCount += Math.ceil(word.length / 3.7);
    }

    // Punctuation and symbol overhead (dashes, slashes, brackets, underscores, camelCase)
    const symbols = word.match(/[^a-zA-Z0-9]/g);
    if (symbols && symbols.length > 1) {
      tokenCount += Math.floor(symbols.length / 2);
    }
  }

  // Account for leading indentation/newlines which produce independent tokens
  let indentTokens = 0;
  for (const line of lines) {
    const indentMatch = line.match(/^(\s+)/);
    if (indentMatch) {
      indentTokens += Math.ceil(indentMatch[1].length / 4);
    }
  }

  const estimatedTokens = Math.max(1, Math.round(tokenCount + indentTokens * 0.5));

  let tier: TokenTier = 'lean';
  if (estimatedTokens > 4000) {
    tier = 'heavy';
  } else if (estimatedTokens >= 1000) {
    tier = 'moderate';
  }

  return {
    estimatedTokens,
    charCount,
    wordCount,
    lineCount,
    tier,
  };
}

/**
 * Categorize a file inside a skill directory into its primary role
 */
export function classifyFileRole(relativeFilePath: string): FileRole {
  const normalized = relativeFilePath.toLowerCase().replace(/\\/g, '/');
  const ext = path.extname(normalized);
  const basename = path.basename(normalized);

  if (basename === 'skill.md' || basename === 'skill' || basename.endsWith('.mdc') || basename === '.windsurfrules') {
    return 'instruction';
  }

  if (normalized.includes('/scripts/') || normalized.startsWith('scripts/') || normalized.startsWith('bin/') || ext === '.py' || ext === '.sh' || ext === '.bash' || ext === '.js' || ext === '.ts' || ext === '.mjs') {
    return 'script';
  }

  if (normalized.includes('/schemas/') || normalized.startsWith('schemas/') || basename.endsWith('.schema.json')) {
    return 'schema';
  }

  if (normalized.includes('/references/') || normalized.startsWith('references/') || normalized.includes('/docs/')) {
    return 'reference';
  }

  if (normalized.includes('/tests/') || normalized.includes('/__tests__/') || basename.includes('test.') || basename.includes('spec.')) {
    return 'test';
  }

  if (ext === '.json' || ext === '.yaml' || ext === '.yml' || ext === '.csv' || ext === '.tsv') {
    return 'data';
  }

  if (ext === '.md' || ext === '.txt') {
    return 'doc';
  }

  return 'other';
}
