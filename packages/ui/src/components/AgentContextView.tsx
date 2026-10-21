import { useState, useMemo } from 'preact/hooks';
import type { SkillItem, HarnessId } from '@skill-hub/core';

interface AgentContextViewProps {
  skills: SkillItem[];
  onSelectSkill: (skill: SkillItem) => void;
}

type FormatMode = 'antigravity' | 'claude' | 'raw';
type ViewMode = 'prompt' | 'audit';

export function AgentContextView({ skills, onSelectSkill }: AgentContextViewProps) {
  const [format, setFormat] = useState<FormatMode>('antigravity');
  const [viewMode, setViewMode] = useState<ViewMode>('prompt');
  const [harnessFilter, setHarnessFilter] = useState<'all' | HarnessId>('all');
  const [search, setSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Filter skills
  const activeSkills = useMemo(() => {
    return skills.filter((s) => {
      if (harnessFilter !== 'all' && s.harnessId !== harnessFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const mName = s.name.toLowerCase().includes(q);
        const mDesc = (s.description || '').toLowerCase().includes(q);
        if (!mName && !mDesc) return false;
      }
      return true;
    });
  }, [skills, harnessFilter, search]);

  // Generate context injection string based on format
  const generatedContext = useMemo(() => {
    if (activeSkills.length === 0) {
      return '// No active skills matched the current filter.';
    }

    if (format === 'antigravity') {
      const lines = [
        '<skills>',
        "You can use specialized 'skills' to help you with complex tasks. Each skill has a name and a description listed below.",
        '',
        'Skills are folders of instructions, scripts, and resources that extend your capabilities for specialized tasks. Each skill folder contains:',
        '- SKILL.md (required): The main instruction file with YAML frontmatter (name, description) and detailed markdown instructions',
        '',
        'If a skill seems relevant to your current task, you MUST read its SKILL.md instructions before proceeding.',
        '',
        'Available skills:',
      ];

      for (const s of activeSkills) {
        const desc = s.description || '(No description provided)';
        lines.push(`- ${s.name} (${s.mainFilePath}): ${desc}`);
      }

      lines.push('</skills>');
      return lines.join('\n');
    }

    if (format === 'claude') {
      const lines = [
        'Available agent skills:',
        '',
      ];
      for (const s of activeSkills) {
        const desc = s.description || '(No description provided)';
        lines.push(`- ${s.name}: ${desc}`);
      }
      return lines.join('\n');
    }

    // raw
    return activeSkills
      .map((s) => `${s.name}:\n${s.description || '(No description)'}`)
      .join('\n\n');
  }, [activeSkills, format]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalChars = generatedContext.length;
    const estTokens = Math.max(0, Math.ceil(totalChars / 4));
    const avgCharsPerDesc = activeSkills.length
      ? Math.round(activeSkills.reduce((acc, s) => acc + (s.description?.length || 0), 0) / activeSkills.length)
      : 0;
    const avgTokensPerDesc = Math.ceil(avgCharsPerDesc / 4);

    return {
      totalChars,
      estTokens,
      avgCharsPerDesc,
      avgTokensPerDesc,
    };
  }, [generatedContext, activeSkills]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="context-view-container">
      {/* Overview Card */}
      <div className="context-header-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--fg-default)' }}>
              Agent Context & Prompt Injection
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '4px' }}>
              Inspect the exact system instructions and skill description block loaded into the AI agent context window at session start.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="btn-group" style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                className={`drawer-subnav-btn ${viewMode === 'prompt' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setViewMode('prompt')}
                type="button"
              >
                Injected Prompt
              </button>
              <button
                className={`drawer-subnav-btn ${viewMode === 'audit' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setViewMode('audit')}
                type="button"
              >
                Description Audit
              </button>
            </div>

            <button
              className="btn-default"
              onClick={handleCopy}
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? 'Copied to clipboard!' : 'Copy prompt'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="context-stats-grid">
          <div className="context-stat-card">
            <div className="context-stat-label">Injected Skills</div>
            <div className="context-stat-value">{activeSkills.length}</div>
            <div className="context-stat-sub">active in prompt</div>
          </div>
          <div className="context-stat-card">
            <div className="context-stat-label">Prompt Tokens</div>
            <div className="context-stat-value">~{stats.estTokens.toLocaleString()}</div>
            <div className="context-stat-sub">~4 chars/token heuristic</div>
          </div>
          <div className="context-stat-card">
            <div className="context-stat-label">Payload Size</div>
            <div className="context-stat-value">{(stats.totalChars / 1024).toFixed(1)} KB</div>
            <div className="context-stat-sub">{stats.totalChars.toLocaleString()} characters</div>
          </div>
          <div className="context-stat-card">
            <div className="context-stat-label">Avg Description</div>
            <div className="context-stat-value">~{stats.avgTokensPerDesc} tok</div>
            <div className="context-stat-sub">{stats.avgCharsPerDesc} chars per skill</div>
          </div>
        </div>

        {/* Persistent Filter & Format Toolbar (Applies to both Injected Prompt and Description Audit) */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--fg-muted)', fontWeight: 500 }}>Target Format:</span>
              <select
                className="primer-select"
                value={format}
                onChange={(e) => setFormat((e.target as HTMLSelectElement).value as FormatMode)}
              >
                <option value="antigravity">Google Antigravity (&lt;skills&gt; XML)</option>
                <option value="claude">Claude Code (Markdown list)</option>
                <option value="raw">Raw Descriptions</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--fg-muted)', fontWeight: 500 }}>Harness:</span>
              <select
                className="primer-select"
                value={harnessFilter}
                onChange={(e) => setHarnessFilter((e.target as HTMLSelectElement).value as any)}
              >
                <option value="all">All harnesses</option>
                <option value="antigravity">Google Antigravity</option>
                <option value="claude-code">Claude Code</option>
                <option value="claude-desktop">Claude Desktop</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="search-box" style={{ maxWidth: '240px' }}>
              <input
                type="text"
                placeholder="Filter skills..."
                value={search}
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                className="search-input"
                style={{ padding: '4px 28px 4px 10px', height: '28px', fontSize: '12px' }}
              />
              {search ? (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  title="Clear filter"
                  type="button"
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.751.751 0 0 1 0-1.06Z"></path>
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'prompt' ? (
        <div className="context-prompt-box">
          <div className="context-prompt-toolbar">
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fg-default)' }}>
              Injected Startup Prompt • {activeSkills.length} active skills
            </span>
            <span style={{ fontSize: '11px', color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>
              ~{stats.estTokens.toLocaleString()} tokens • {(stats.totalChars / 1024).toFixed(1)} KB
            </span>
          </div>

          <pre className="context-prompt-code">
            {generatedContext}
          </pre>
        </div>
      ) : (
        <div className="github-box">
          <div className="github-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Skill Description Verbosity Audit ({activeSkills.length})</span>
            <span style={{ fontSize: '12px', color: 'var(--fg-muted)', fontWeight: 400 }}>
              Flagged if &gt; 100 tokens
            </span>
          </div>

          <table className="context-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Skill Name</th>
                <th style={{ width: '12%' }}>Tokens</th>
                <th style={{ width: '12%' }}>Chars</th>
                <th style={{ width: '14%' }}>Scope</th>
                <th>Injected Description</th>
              </tr>
            </thead>
            <tbody>
              {activeSkills.map((s) => {
                const descLen = s.description ? s.description.length : 0;
                const descTokens = Math.ceil(descLen / 4);
                const isHeavyDesc = descTokens > 100;

                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelectSkill(s)}
                    style={{ cursor: 'pointer' }}
                    title="Click to inspect or edit skill"
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--accent-fg)' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--fg-subtle)' }}>
                        {s.harnessId}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${isHeavyDesc ? 'badge-update' : ''}`}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        ~{descTokens} tok
                      </span>
                    </td>
                    <td style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                      {descLen} chars
                    </td>
                    <td>
                      <span className="badge">{s.scope}</span>
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: '12px',
                          color: s.description ? 'var(--fg-default)' : 'var(--fg-subtle)',
                          lineHeight: '1.4',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {s.description || '(No description provided in frontmatter)'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
