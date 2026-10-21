import { useState, useEffect } from 'preact/hooks';
import type { SkillItem } from '@skill-hub/core';
import { TokenBadge } from './TokenBadge.js';

interface SkillDrawerProps {
  skill: SkillItem | null;
  onClose: () => void;
  onSaveSkill: (skill: SkillItem, content: string) => Promise<boolean>;
}

export function SkillDrawer({ skill, onClose, onSaveSkill }: SkillDrawerProps) {
  if (!skill) return null;

  const [activeTab, setActiveTab] = useState<'preview' | 'raw' | 'files' | 'edit'>('preview');
  const [content, setContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setLoadingContent(true);
    fetch(`/api/skill?path=${encodeURIComponent(skill.mainFilePath)}`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content || '');
      })
      .catch(() => {
        setContent('Failed to load skill content.');
      })
      .finally(() => {
        setLoadingContent(false);
      });
  }, [skill.mainFilePath]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSaveSkill(skill, content);
    setSaving(false);
    if (ok) {
      setActiveTab('preview');
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{skill.name}</h2>
              <span className="pill pill-harness">{skill.harnessId}</span>
              <span className="pill pill-scope">{skill.scope}</span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <TokenBadge tokens={skill.tokens} showDetails />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <div className="drawer-tabs">
          <button
            className={`drawer-tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Instructions
          </button>
          <button
            className={`drawer-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Bundled Assets ({skill.files.length})
          </button>
          <button
            className={`drawer-tab ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            Raw
          </button>
          <button
            className={`drawer-tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Edit
          </button>
        </div>

        <div className="drawer-body">
          {loadingContent ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Loading instructions...
            </div>
          ) : activeTab === 'preview' ? (
            <div className="markdown-body">
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {content}
              </pre>
            </div>
          ) : activeTab === 'raw' ? (
            <pre style={{ fontSize: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', overflowX: 'auto' }}>
              {content}
            </pre>
          ) : activeTab === 'files' ? (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Files located in <code style={{ color: 'var(--accent)' }}>{skill.dirPath}</code>
              </p>
              {skill.files.map((f) => (
                <div key={f.relativePath} className="file-item">
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{f.relativePath}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {f.absolutePath}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="pill pill-scope">{f.role}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {(f.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'edit' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
              <textarea
                style={{
                  flex: 1,
                  minHeight: '380px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  outline: 'none',
                  resize: 'vertical',
                }}
                value={content}
                onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  className="tab-btn"
                  onClick={() => setActiveTab('preview')}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
