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
  const detectedHarnesses = harnesses.filter((h) => h.detected);

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-section-title">Harness</div>
        <div className="filter-list">
          <button
            className={`filter-item ${selectedHarness === 'all' ? 'active' : ''}`}
            onClick={() => onSelectHarness('all')}
          >
            <span>All Harnesses</span>
          </button>
          {detectedHarnesses.map((h) => {
            const count =
              activeTab === 'skills'
                ? skillCountsByHarness[h.id] || 0
                : mcpCountsByHarness[h.id] || 0;
            return (
              <button
                key={h.id}
                className={`filter-item ${selectedHarness === h.id ? 'active' : ''}`}
                onClick={() => onSelectHarness(h.id)}
              >
                <span>{h.name}</span>
                <span className="filter-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'skills' && (
        <>
          <div>
            <div className="sidebar-section-title">Bundle / Pack</div>
            <div className="filter-list">
              <button
                className={`filter-item ${selectedBundle === 'all' ? 'active' : ''}`}
                onClick={() => onSelectBundle('all')}
              >
                <span>All Bundles</span>
              </button>
              {bundles.map((b) => (
                <button
                  key={b}
                  className={`filter-item ${selectedBundle === b ? 'active' : ''}`}
                  onClick={() => onSelectBundle(b)}
                >
                  <span style={{ textTransform: 'capitalize' }}>{b.replace(/-/g, ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="sidebar-section-title">Scope</div>
            <div className="filter-list">
              {(['all', 'global', 'workspace', 'builtin'] as const).map((sc) => (
                <button
                  key={sc}
                  className={`filter-item ${selectedScope === sc ? 'active' : ''}`}
                  onClick={() => onSelectScope(sc)}
                >
                  <span style={{ textTransform: 'capitalize' }}>{sc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="sidebar-section-title">Context Weight</div>
            <div className="filter-list">
              <button
                className={`filter-item ${selectedTier === 'all' ? 'active' : ''}`}
                onClick={() => onSelectTier('all')}
              >
                <span>All Weights</span>
              </button>
              <button
                className={`filter-item ${selectedTier === 'lean' ? 'active' : ''}`}
                onClick={() => onSelectTier('lean')}
              >
                <span>Lean (&lt; 1,000)</span>
              </button>
              <button
                className={`filter-item ${selectedTier === 'moderate' ? 'active' : ''}`}
                onClick={() => onSelectTier('moderate')}
              >
                <span>Moderate (1k - 4k)</span>
              </button>
              <button
                className={`filter-item ${selectedTier === 'heavy' ? 'active' : ''}`}
                onClick={() => onSelectTier('heavy')}
              >
                <span>Heavy (&gt; 4,000)</span>
              </button>
            </div>
          </div>
        </>
      )}

      <div>
        <div className="sidebar-section-title">Updates</div>
        <div className="filter-list">
          <button
            className={`filter-item ${showUpdatesOnly ? 'active' : ''}`}
            onClick={() => onToggleUpdatesOnly(!showUpdatesOnly)}
          >
            <span>Updates Available</span>
            <span
              className="filter-badge"
              style={{
                background: updatesCount > 0 ? 'var(--amber-bg)' : undefined,
                color: updatesCount > 0 ? 'var(--amber)' : undefined,
                fontWeight: updatesCount > 0 ? 'bold' : 'normal',
              }}
            >
              {updatesCount}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
