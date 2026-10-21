import type { McpServerItem } from '@skill-hub/core';

interface McpListProps {
  mcps: McpServerItem[];
  onUpdateMcp: (mcp: McpServerItem, newVersion: string) => void;
  updatingMcpId: string | null;
}

export function McpList({ mcps, onUpdateMcp, updatingMcpId }: McpListProps) {
  if (mcps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg-muted)', border: '1px dashed var(--border-default)', borderRadius: '6px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--fg-default)', marginBottom: '4px' }}>No MCP servers found</p>
        <p style={{ fontSize: '13px' }}>Check your configuration files in Claude Desktop or Antigravity.</p>
      </div>
    );
  }

  return (
    <div className="github-box">
      <div className="github-box-header">
        <span>Model Context Protocol Servers ({mcps.length})</span>
        <span style={{ fontSize: '12px', color: 'var(--fg-muted)', fontWeight: 400 }}>Sorted by name</span>
      </div>

      {mcps.map((mcp) => {
        const hasUpdate = mcp.updateInfo.hasUpdate && mcp.updateInfo.latestVersion;
        const isUpdating = updatingMcpId === mcp.id;

        return (
          <div key={mcp.id} className="github-row" style={{ cursor: 'default' }}>
            <div className="row-main">
              <div className="row-title-line">
                <span className="row-title" style={{ textDecoration: 'none' }}>{mcp.name}</span>
                <span className="badge">{mcp.harnessId}</span>
                <span className="badge">{mcp.transport}</span>
                <span className="badge">{mcp.packageInfo.type}</span>
                {hasUpdate ? (
                  <span className="badge badge-update">
                    v{mcp.packageInfo.currentVersion || '?'} to v{mcp.updateInfo.latestVersion}
                  </span>
                ) : mcp.packageInfo.currentVersion ? (
                  <span className="badge" style={{ color: 'var(--success-fg)', borderColor: 'rgba(46, 160, 67, 0.3)' }}>
                    v{mcp.packageInfo.currentVersion}
                  </span>
                ) : null}
              </div>

              <div style={{ background: 'var(--canvas-subtle)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'nowrap', marginTop: '4px' }}>
                {mcp.url ? (
                  <span>URL: {mcp.url}</span>
                ) : (
                  <span>
                    <strong style={{ color: 'var(--fg-default)' }}>{mcp.command}</strong> {mcp.args.join(' ')}
                  </span>
                )}
              </div>

              <div className="row-meta-line">
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--fg-subtle)' }}>
                  {mcp.configFilePath}
                </span>
              </div>
            </div>

            {hasUpdate && mcp.updateInfo.latestVersion && (
              <div style={{ flexShrink: 0, alignSelf: 'center' }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  disabled={isUpdating}
                  onClick={() => onUpdateMcp(mcp, mcp.updateInfo.latestVersion!)}
                >
                  {isUpdating ? 'Updating...' : `Update to v${mcp.updateInfo.latestVersion}`}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
