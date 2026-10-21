interface NavbarProps {
  activeTab: 'skills' | 'mcps';
  onTabChange: (tab: 'skills' | 'mcps') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  checkingUpdates: boolean;
  onCheckUpdates: () => void;
  totalSkills: number;
  totalMcps: number;
  detectedHarnesses: number;
}

export function Navbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  checkingUpdates,
  onCheckUpdates,
  totalSkills,
  totalMcps,
  detectedHarnesses,
}: NavbarProps) {
  return (
    <header className="top-navbar">
      <div className="brand">
        <div className="brand-logo">⚡</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title">Skill Hub</span>
            <span className="brand-badge">127.0.0.1:4350</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <button
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => onTabChange('skills')}
        >
          Skills ({totalSkills})
        </button>
        <button
          className={`tab-btn ${activeTab === 'mcps' ? 'active' : ''}`}
          onClick={() => onTabChange('mcps')}
        >
          MCP Servers ({totalMcps})
        </button>
      </div>

      <div className="nav-actions">
        <input
          type="text"
          className="search-input"
          placeholder="Filter skills or MCPs..."
          value={searchQuery}
          onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
        />
        <button
          className="btn-primary"
          onClick={onCheckUpdates}
          disabled={checkingUpdates}
        >
          {checkingUpdates ? 'Checking...' : '🔄 Check Updates'}
        </button>
      </div>
    </header>
  );
}
