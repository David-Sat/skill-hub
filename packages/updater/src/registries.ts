/**
 * Registry clients for querying latest versions via unauthenticated public APIs.
 * All requests use strict timeouts (3s) to guarantee high performance.
 */

export async function fetchNpmLatest(packageName: string, timeoutMs: number = 3000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const encoded = packageName.startsWith('@')
      ? `@${encodeURIComponent(packageName.slice(1))}`
      : encodeURIComponent(packageName);

    const url = `https://registry.npmjs.org/${encoded}/latest`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.version || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPypiLatest(packageName: string, timeoutMs: number = 3000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.info?.version || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchGitHubLatest(repoUrl: string, timeoutMs: number = 3000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/);
    if (!match) return null;
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Skill-Hub-Client',
      },
    });

    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.tag_name || data.name || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
