import { describe, it, expect, afterAll } from 'vitest';
import { startServer, type RunningServer } from '../server.js';

describe('server', () => {
  let appServer: RunningServer;

  it('starts server and responds to /api/scan', async () => {
    appServer = await startServer({ port: 4499, autoOpen: false });
    expect(appServer.port).toBeGreaterThanOrEqual(4499);

    const res = await fetch(`${appServer.url}/api/scan`);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.harnesses).toBeDefined();
    expect(Array.isArray(data.skills)).toBe(true);
    expect(Array.isArray(data.mcps)).toBe(true);
  });

  afterAll(async () => {
    if (appServer) {
      await appServer.close();
    }
  });
});
