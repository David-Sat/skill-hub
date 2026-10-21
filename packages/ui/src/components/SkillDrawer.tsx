import { useState, useEffect } from 'preact/hooks';
import type { SkillItem } from '@skill-hub/core';

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fg-default)' }}>{skill.name}</h2>
              <span className="badge">{skill.scope}</span>
              {skill.bundle && skill.bundle !== 'standalone' && (
                <span className="badge badge-bundle">{skill.bundle}</span>
              )}
              <span className="badge">{skill.harnessId}</span>
            </div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--fg-muted)', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`status-dot ${skill.tokens.tier}`}></span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {skill.tokens.estimatedTokens.toLocaleString()} tokens
                </span>
              </span>
              <span>{skill.tokens.lineCount} lines</span>
              <span>{skill.tokens.charCount.toLocaleString()} chars</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--fg-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        <div className="drawer-subnav">
          <button
            className={`drawer-subnav-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Instructions
          </button>
          <button
            className={`drawer-subnav-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Bundled Assets ({skill.files.length})
          </button>
          <button
            className={`drawer-subnav-btn ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            Raw
          </button>
          <button
            className={`drawer-subnav-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Edit
          </button>
        </div>

        <div className="drawer-body">
          {loadingContent ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--fg-subtle)' }}>
              Loading instructions...
            </div>
          ) : activeTab === 'preview' ? (
            <div className="markdown-body">
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                {content}
              </pre>
            </div>
          ) : activeTab === 'raw' ? (
            <pre style={{ fontSize: '12px', background: 'var(--canvas-subtle)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-default)', overflowX: 'auto' }}>
              {content}
            </pre>
          ) : activeTab === 'files' ? (
            <div className="github-box">
              <div className="github-box-header">
                <span>Directory: {skill.dirPath}</span>
              </div>
              {skill.files.map((f) => (
                <div key={f.relativePath} className="file-row">
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--accent-fg)' }}>{f.relativePath}</div>
                    <div style={{ fontSize: '11px', color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>
                      {f.absolutePath}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge">{f.role}</span>
                    <span style={{ fontSize: '11px', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
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
                  minHeight: '400px',
                  background: 'var(--canvas-inset)',
                  color: 'var(--fg-default)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  padding: '12px',
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
                  className="btn-default"
                  onClick={() => setActiveTab('preview')}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
