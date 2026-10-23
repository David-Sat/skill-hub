interface NavbarProps {
  activeTab: 'skills' | 'mcps' | 'context';
  onTabChange: (tab: 'skills' | 'mcps' | 'context') => void;
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
}: NavbarProps) {
  return (
    <header className="top-navbar">
      <div className="brand">
        <span className="brand-kaomoji">(ノ^_^)ノ┻━┻</span>
        <div className="brand-text">
          <span className="brand-title">SkillDesk</span>
          <span className="brand-badge">local:4350</span>
        </div>
      </div>

      <nav className="subnav-tabs">
        <button
          className={`subnav-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => onTabChange('skills')}
        >
          <span>Skills</span>
          <span className="counter-badge">{totalSkills}</span>
        </button>
        <button
          className={`subnav-tab ${activeTab === 'mcps' ? 'active' : ''}`}
          onClick={() => onTabChange('mcps')}
        >
          <span>MCP Servers</span>
          <span className="counter-badge">{totalMcps}</span>
        </button>
        <button
          className={`subnav-tab ${activeTab === 'context' ? 'active' : ''}`}
          onClick={() => onTabChange('context')}
        >
          <span>Agent Context</span>
          <span className="counter-badge">Prompt</span>
        </button>
      </nav>

      <div className="nav-actions">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Type / to search..."
            value={searchQuery}
            onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
          />
          {searchQuery ? (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
              </svg>
            </button>
          ) : (
            <span className="search-shortcut">/</span>
          )}
        </div>
        <button
          className="btn-default"
          onClick={onCheckUpdates}
          disabled={checkingUpdates}
        >
          {checkingUpdates ? 'Checking...' : 'Check updates'}
        </button>
      </div>
    </header>
  );
}
