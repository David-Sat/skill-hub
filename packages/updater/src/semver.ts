/**
 * Compares two semantic version strings (e.g. "1.2.3" vs "1.3.0" or "v2.1" vs "2.2.0")
 * Returns:
 *   1 if vA > vB
 *  -1 if vA < vB
 *   0 if vA === vB
 */
export function compareVersions(versionA: string, versionB: string): number {
  const cleanA = sanitizeVersion(versionA);
  const cleanB = sanitizeVersion(versionB);

  const partsA = cleanA.split('.').map((p) => parseInt(p, 10) || 0);
  const partsB = cleanB.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }

  return 0;
}

export function isNewerVersion(current: string, latest: string): boolean {
  return compareVersions(latest, current) > 0;
}

function sanitizeVersion(v: string): string {
  let res = v.trim().toLowerCase();
  if (res.startsWith('v')) res = res.slice(1);
  if (res.startsWith('^') || res.startsWith('~') || res.startsWith('>=')) {
    res = res.replace(/^[\^~>=]+/, '');
  }
  // Strip prerelease metadata for basic comparison
  const hyphenIdx = res.indexOf('-');
  if (hyphenIdx !== -1) {
    res = res.slice(0, hyphenIdx);
  }
  return res;
}
