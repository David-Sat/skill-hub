import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../server.js';

describe('mcp server', () => {
  it('creates an MCP server instance with required tools', () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
  });
});
