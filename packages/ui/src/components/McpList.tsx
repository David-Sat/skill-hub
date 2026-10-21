import type { McpServerItem } from '@skill-hub/core';

interface McpListProps {
  mcps: McpServerItem[];
  onUpdateMcp: (mcp: McpServerItem, newVersion: string) => void;
  updatingMcpId: string | null;
}

export function McpList({ mcps, onUpdateMcp, updatingMcpId }: McpListProps) {
  if (mcps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No MCP servers found</p>
        <p style={{ fontSize: '13px' }}>Check your configuration files in Claude Desktop, Cursor, or Antigravity.</p>
      </div>
    );
  }

  return (
    <div className="grid-cards">
      {mcps.map((mcp) => {
        const hasUpdate = mcp.updateInfo.hasUpdate && mcp.updateInfo.latestVersion;
        const isUpdating = updatingMcpId === mcp.id;

        return (
          <div key={mcp.id} className="card" style={{ cursor: 'default' }}>
            <div className="card-header">
              <div>
                <div className="card-title">{mcp.name}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <span className="pill pill-harness">{mcp.harnessId}</span>
                  <span className="pill pill-scope">{mcp.transport}</span>
                  <span className="pill pill-scope">{mcp.packageInfo.type}</span>
                </div>
              </div>

              {hasUpdate ? (
                <span className="pill pill-update">
                  v{mcp.packageInfo.currentVersion || '?'} → v{mcp.updateInfo.latestVersion}
                </span>
              ) : mcp.packageInfo.currentVersion ? (
                <span className="pill pill-lean">
                  v{mcp.packageInfo.currentVersion} (latest)
                </span>
              ) : null}
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {mcp.url ? (
                <span>URL: {mcp.url}</span>
              ) : (
                <span>
                  <strong>{mcp.command}</strong> {mcp.args.join(' ')}
                </span>
              )}
            </div>

            <div className="card-footer" style={{ marginTop: 'auto' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px', whiteSpace: 'nowrap' }}>
                {mcp.configFilePath}
              </span>

              {hasUpdate && mcp.updateInfo.latestVersion && (
                <button
                  className="btn-primary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  disabled={isUpdating}
                  onClick={() => onUpdateMcp(mcp, mcp.updateInfo.latestVersion!)}
                >
                  {isUpdating ? 'Updating...' : `⚡ Update to v${mcp.updateInfo.latestVersion}`}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
