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
        <div className="brand-logo">
          <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>David-Sat</span>
          <span style={{ color: 'var(--fg-subtle)' }}>/</span>
          <span className="brand-title">skill-hub</span>
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
