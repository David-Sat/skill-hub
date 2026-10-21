import type { HarnessId, HarnessInfo, TokenTier } from '@skill-hub/core';

interface SidebarProps {
  harnesses: HarnessInfo[];
  selectedHarness: 'all' | HarnessId;
  onSelectHarness: (id: 'all' | HarnessId) => void;
  selectedScope: 'all' | 'global' | 'workspace' | 'builtin';
  onSelectScope: (scope: 'all' | 'global' | 'workspace' | 'builtin') => void;
  selectedBundle: string;
  onSelectBundle: (bundle: string) => void;
  bundles: string[];
  selectedTier: 'all' | TokenTier;
  onSelectTier: (tier: 'all' | TokenTier) => void;
  showUpdatesOnly: boolean;
  onToggleUpdatesOnly: (val: boolean) => void;
  skillCountsByHarness: Record<string, number>;
  mcpCountsByHarness: Record<string, number>;
  activeTab: 'skills' | 'mcps';
  updatesCount: number;
}

export function Sidebar({
  harnesses,
  selectedHarness,
  onSelectHarness,
  selectedScope,
  onSelectScope,
  selectedBundle,
  onSelectBundle,
  bundles,
  selectedTier,
  onSelectTier,
  showUpdatesOnly,
  onToggleUpdatesOnly,
  skillCountsByHarness,
  mcpCountsByHarness,
  activeTab,
  updatesCount,
}: SidebarProps) {
  // Only display harnesses that are actually installed on the system
  const installedHarnesses = harnesses.filter((h) => h.detected);

  const toggleHarness = (id: HarnessId) => {
    onSelectHarness(selectedHarness === id ? 'all' : id);
  };

  const toggleBundle = (b: string) => {
    onSelectBundle(selectedBundle === b ? 'all' : b);
  };

  const toggleScope = (sc: 'global' | 'workspace' | 'builtin') => {
    onSelectScope(selectedScope === sc ? 'all' : sc);
  };

  const toggleTier = (t: TokenTier) => {
    onSelectTier(selectedTier === t ? 'all' : t);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-title">Harness</div>
        {installedHarnesses.map((h) => {
          const count =
            activeTab === 'skills'
              ? skillCountsByHarness[h.id] || 0
              : mcpCountsByHarness[h.id] || 0;
          const isSelected = selectedHarness === h.id;

          return (
            <button
              key={h.id}
              className={`filter-item ${isSelected ? 'active' : ''}`}
              onClick={() => toggleHarness(h.id)}
            >
              <span>{h.name}</span>
              <span className="filter-counter">{count}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'skills' && (
        <>
          {bundles.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Bundle</div>
              {bundles.map((b) => {
                const isSelected = selectedBundle === b;
                return (
                  <button
                    key={b}
                    className={`filter-item ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleBundle(b)}
                  >
                    <span style={{ textTransform: 'capitalize' }}>
                      {b.replace(/-/g, ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="sidebar-section">
            <div className="sidebar-section-title">Scope</div>
            {(['global', 'workspace', 'builtin'] as const).map((sc) => {
              const isSelected = selectedScope === sc;
              return (
                <button
                  key={sc}
                  className={`filter-item ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleScope(sc)}
                >
                  <span style={{ textTransform: 'capitalize' }}>{sc}</span>
                </button>
              );
            })}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Context Weight</div>
            <button
              className={`filter-item ${selectedTier === 'lean' ? 'active' : ''}`}
              onClick={() => toggleTier('lean')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-dot lean"></span>
                <span>Lean (&lt; 1k)</span>
              </div>
            </button>
            <button
              className={`filter-item ${selectedTier === 'moderate' ? 'active' : ''}`}
              onClick={() => toggleTier('moderate')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-dot moderate"></span>
                <span>Moderate (1k–4k)</span>
              </div>
            </button>
            <button
              className={`filter-item ${selectedTier === 'heavy' ? 'active' : ''}`}
              onClick={() => toggleTier('heavy')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-dot heavy"></span>
                <span>Heavy (&gt; 4k)</span>
              </div>
            </button>
          </div>
        </>
      )}

      <div className="sidebar-section">
        <div className="sidebar-section-title">Maintenance</div>
        <button
          className={`filter-item ${showUpdatesOnly ? 'active' : ''}`}
          onClick={() => onToggleUpdatesOnly(!showUpdatesOnly)}
        >
          <span>Updates available</span>
          {updatesCount > 0 && (
            <span
              className="filter-counter"
              style={{
                background: 'var(--attention-subtle)',
                color: 'var(--attention-fg)',
                fontWeight: 600,
              }}
            >
              {updatesCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
