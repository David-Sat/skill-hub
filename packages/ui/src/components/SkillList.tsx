import type { SkillItem } from '@skill-hub/core';

interface SkillListProps {
  skills: SkillItem[];
  onSelectSkill: (skill: SkillItem) => void;
}

export function SkillList({ skills, onSelectSkill }: SkillListProps) {
  if (skills.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg-muted)', border: '1px dashed var(--border-default)', borderRadius: '6px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--fg-default)', marginBottom: '4px' }}>No skills match your filters</p>
        <p style={{ fontSize: '13px' }}>Click an active filter to deselect it or clear your search query.</p>
      </div>
    );
  }

  return (
    <div className="github-box">
      <div className="github-box-header">
        <span>Skills ({skills.length})</span>
        <span style={{ fontSize: '12px', color: 'var(--fg-muted)', fontWeight: 400 }}>Sorted by name</span>
      </div>

      {skills.map((skill) => {
        const scriptCount = skill.files.filter((f) => f.role === 'script').length;
        const schemaCount = skill.files.filter((f) => f.role === 'schema').length;

        const maxTokens = 15000;
        const fillPercent = Math.min(100, Math.round((skill.tokens.estimatedTokens / maxTokens) * 100));

        return (
          <div
            key={skill.id}
            className="github-row"
            onClick={() => onSelectSkill(skill)}
          >
            <div className="row-main">
              <div className="row-title-line">
                <span className="row-title">{skill.name}</span>
                <span className="badge">{skill.scope}</span>
                {skill.bundle && skill.bundle !== 'standalone' && (
                  <span className="badge badge-bundle">{skill.bundle}</span>
                )}
                <span className="badge">{skill.harnessId}</span>
                {skill.status.hasUpdate && (
                  <span className="badge badge-update">update v{skill.status.latestVersion}</span>
                )}
              </div>

              <p className="row-desc">
                {skill.description || 'No description provided.'}
              </p>

              <div className="row-meta-line">
                <div className="meta-item">
                  <span className={`status-dot ${skill.tokens.tier}`}></span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {skill.tokens.estimatedTokens.toLocaleString()} tokens
                  </span>
                </div>

                <div className="meta-item">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.914 3.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 16h-10.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V5.75h-3.25a1.5 1.5 0 0 1-1.5-1.5V1.5Zm7.75.56v2.69c0 .138.112.25.25.25h2.69Z"></path>
                  </svg>
                  <span>
                    {skill.files.length} {skill.files.length === 1 ? 'file' : 'files'}
                    {scriptCount > 0 && ` (${scriptCount} script${scriptCount > 1 ? 's' : ''})`}
                    {schemaCount > 0 && ` (${schemaCount} schema${schemaCount > 1 ? 's' : ''})`}
                  </span>
                </div>

                <div className="meta-item">
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {skill.metadata.version ? `v${skill.metadata.version}` : 'unversioned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="token-gauge">
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                {skill.tokens.tier.toUpperCase()}
              </span>
              <div className="token-bar-track">
                <div
                  className={`token-bar-fill ${skill.tokens.tier}`}
                  style={{ width: `${Math.max(6, fillPercent)}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
