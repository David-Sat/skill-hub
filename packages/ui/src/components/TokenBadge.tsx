import type { TokenMetric } from '@skill-hub/core';

interface TokenBadgeProps {
  tokens: TokenMetric;
  showDetails?: boolean;
}

export function TokenBadge({ tokens, showDetails = false }: TokenBadgeProps) {
  const { estimatedTokens, charCount, lineCount, tier } = tokens;

  const tierClass =
    tier === 'lean'
      ? 'pill-lean'
      : tier === 'moderate'
      ? 'pill-moderate'
      : 'pill-heavy';

  const tierLabel =
    tier === 'lean' ? 'Lean' : tier === 'moderate' ? 'Moderate' : 'Heavy';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span className={`pill ${tierClass}`}>
        <span>{estimatedTokens.toLocaleString()} tok</span>
        <span>•</span>
        <span>{tierLabel}</span>
      </span>
      {showDetails && (
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {lineCount} lines • {charCount.toLocaleString()} chars
        </span>
      )}
    </div>
  );
}
