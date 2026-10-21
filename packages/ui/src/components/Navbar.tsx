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
}: NavbarProps) {
  return (
    <header className="top-navbar">
      <div className="brand">
        <div className="brand-logo" title="Skill Hub">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25ZM4.22 5.47a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06L5.28 11.03a.75.75 0 0 1-1.06-1.06L5.94 8.25 4.22 6.53a.75.75 0 0 1 0-1.06Zm4.53 4.28h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1 0-1.5Z"/>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-title">Skill Hub</span>
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
          <span className="search-shortcut">/</span>
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
