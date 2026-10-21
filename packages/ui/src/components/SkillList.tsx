import type { SkillItem } from '@skill-hub/core';
import { TokenBadge } from './TokenBadge.js';

interface SkillListProps {
  skills: SkillItem[];
  onSelectSkill: (skill: SkillItem) => void;
}

export function SkillList({ skills, onSelectSkill }: SkillListProps) {
  if (skills.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No skills match your filters</p>
        <p style={{ fontSize: '13px' }}>Try selecting "All Harnesses" or clearing your search query.</p>
      </div>
    );
  }

  return (
    <div className="grid-cards">
      {skills.map((skill) => {
        const scriptCount = skill.files.filter((f) => f.role === 'script').length;
        const schemaCount = skill.files.filter((f) => f.role === 'schema').length;

        return (
          <div
            key={skill.id}
            className="card"
            onClick={() => onSelectSkill(skill)}
          >
            <div className="card-header">
              <div>
                <div className="card-title">{skill.name}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <span className="pill pill-harness">{skill.harnessId}</span>
                  <span className="pill pill-scope">{skill.scope}</span>
                  {skill.status.hasUpdate && (
                    <span className="pill pill-update">Update v{skill.status.latestVersion}</span>
                  )}
                </div>
              </div>
              <TokenBadge tokens={skill.tokens} />
            </div>

            <p className="card-desc">
              {skill.description || 'No description provided.'}
            </p>

            <div className="card-footer">
              <span>
                📁 {skill.files.length} {skill.files.length === 1 ? 'file' : 'files'}
                {scriptCount > 0 && ` (${scriptCount} script${scriptCount > 1 ? 's' : ''})`}
                {schemaCount > 0 && ` (${schemaCount} schema${schemaCount > 1 ? 's' : ''})`}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {skill.metadata.version ? `v${skill.metadata.version}` : 'unversioned'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
