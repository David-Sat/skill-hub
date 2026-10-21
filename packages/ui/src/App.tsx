import { useState, useEffect, useMemo } from 'preact/hooks';
import type { HarnessId, SkillHubScanResult, SkillItem, McpServerItem, TokenTier } from '@skill-hub/core';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { SkillList } from './components/SkillList.js';
import { McpList } from './components/McpList.js';
import { SkillDrawer } from './components/SkillDrawer.js';

export function App() {
  const [data, setData] = useState<SkillHubScanResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingUpdates, setCheckingUpdates] = useState<boolean>(false);
  const [updatingMcpId, setUpdatingMcpId] = useState<string | null>(null);

  // Filters & Navigation
  const [activeTab, setActiveTab] = useState<'skills' | 'mcps'>('skills');
  const [selectedHarness, setSelectedHarness] = useState<'all' | HarnessId>('all');
  const [selectedScope, setSelectedScope] = useState<'all' | 'global' | 'workspace' | 'builtin'>('all');
  const [selectedBundle, setSelectedBundle] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | TokenTier>('all');
  const [showUpdatesOnly, setShowUpdatesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Detail
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchScan = () => {
    setLoading(true);
    fetch('/api/scan')
      .then((res) => res.json())
      .then((scanRes: SkillHubScanResult) => {
        setData(scanRes);
      })
      .catch((err) => {
        showToast('Failed to load scan data: ' + err.message, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchScan();
  }, []);

  const handleCheckUpdates = () => {
    setCheckingUpdates(true);
    showToast('Checking for updates across NPM, PyPI, and GitHub...', 'info');

    fetch('/api/updates')
      .then((res) => res.json())
      .then((updated: { skills: SkillItem[]; mcps: McpServerItem[]; updatesCount: number }) => {
        if (data) {
          setData({
            ...data,
            skills: updated.skills,
            mcps: updated.mcps,
            summary: {
              ...data.summary,
              updatesAvailableCount: updated.updatesCount,
            },
          });
        }
        if (updated.updatesCount > 0) {
          showToast(`Found ${updated.updatesCount} update(s) available!`, 'success');
        } else {
          showToast('All installed skills and MCPs are up to date.', 'success');
        }
      })
      .catch((err) => {
        showToast('Error checking updates: ' + err.message, 'error');
      })
      .finally(() => {
        setCheckingUpdates(false);
      });
  };

  const handleUpdateMcp = async (mcp: McpServerItem, newVersion: string) => {
    setUpdatingMcpId(mcp.id);
    try {
      const res = await fetch('/api/mcp/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configFilePath: mcp.configFilePath,
          configKey: mcp.configKey,
          newVersion,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(`Successfully updated ${mcp.name} to v${newVersion}!`, 'success');
        fetchScan();
      } else {
        showToast(`Failed to update ${mcp.name}: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error updating MCP: ${err.message}`, 'error');
    } finally {
      setUpdatingMcpId(null);
    }
  };

  const handleSaveSkill = async (skill: SkillItem, content: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/skill/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: skill.mainFilePath,
          content,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(`Saved instructions for ${skill.name}!`, 'success');
        fetchScan();
        return true;
      } else {
        showToast(`Failed to save: ${result.error}`, 'error');
        return false;
      }
    } catch (err: any) {
      showToast(`Error saving skill: ${err.message}`, 'error');
      return false;
    }
  };

  // Filter skills
  const filteredSkills = useMemo(() => {
    if (!data) return [];
    return data.skills.filter((s) => {
      if (selectedHarness !== 'all' && s.harnessId !== selectedHarness) return false;
      if (selectedScope !== 'all' && s.scope !== selectedScope) return false;
      if (selectedBundle !== 'all' && s.bundle !== selectedBundle) return false;
      if (selectedTier !== 'all' && s.tokens.tier !== selectedTier) return false;
      if (showUpdatesOnly && !s.status.hasUpdate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [data, selectedHarness, selectedScope, selectedBundle, selectedTier, showUpdatesOnly, searchQuery]);

  const bundles = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const s of data.skills) {
      if (s.bundle) set.add(s.bundle);
    }
    return Array.from(set).sort();
  }, [data]);

  // Filter MCPs
  const filteredMcps = useMemo(() => {
    if (!data) return [];
    return data.mcps.filter((m) => {
      if (selectedHarness !== 'all' && m.harnessId !== selectedHarness) return false;
      if (showUpdatesOnly && !m.updateInfo.hasUpdate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchCommand = m.command?.toLowerCase().includes(q);
        const matchArgs = m.args.some((a) => a.toLowerCase().includes(q));
        if (!matchName && !matchCommand && !matchArgs) return false;
      }
      return true;
    });
  }, [data, selectedHarness, showUpdatesOnly, searchQuery]);

  const skillCountsByHarness = useMemo(() => {
    const counts: Record<string, number> = {};
    if (data) {
      for (const s of data.skills) {
        counts[s.harnessId] = (counts[s.harnessId] || 0) + 1;
      }
    }
    return counts;
  }, [data]);

  const mcpCountsByHarness = useMemo(() => {
    const counts: Record<string, number> = {};
    if (data) {
      for (const m of data.mcps) {
        counts[m.harnessId] = (counts[m.harnessId] || 0) + 1;
      }
    }
    return counts;
  }, [data]);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        checkingUpdates={checkingUpdates}
        onCheckUpdates={handleCheckUpdates}
        totalSkills={data?.skills.length || 0}
        totalMcps={data?.mcps.length || 0}
        detectedHarnesses={data?.summary.detectedHarnesses || 0}
      />

      <div className="layout-body">
        <Sidebar
          harnesses={data?.harnesses || []}
          selectedHarness={selectedHarness}
          onSelectHarness={setSelectedHarness}
          selectedScope={selectedScope}
          onSelectScope={setSelectedScope}
          selectedBundle={selectedBundle}
          onSelectBundle={setSelectedBundle}
          bundles={bundles}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          showUpdatesOnly={showUpdatesOnly}
          onToggleUpdatesOnly={setShowUpdatesOnly}
          skillCountsByHarness={skillCountsByHarness}
          mcpCountsByHarness={mcpCountsByHarness}
          activeTab={activeTab}
          updatesCount={data?.summary.updatesAvailableCount || 0}
        />

        <main className="main-content">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Scanning agent harnesses and configurations...
            </div>
          ) : activeTab === 'skills' ? (
            <SkillList
              skills={filteredSkills}
              onSelectSkill={setSelectedSkill}
            />
          ) : (
            <McpList
              mcps={filteredMcps}
              onUpdateMcp={handleUpdateMcp}
              updatingMcpId={updatingMcpId}
            />
          )}
        </main>
      </div>

      <SkillDrawer
        skill={selectedSkill}
        onClose={() => setSelectedSkill(null)}
        onSaveSkill={handleSaveSkill}
      />

      {toast && (
        <div className="toast">
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: toast.type === 'success' ? 'var(--green)' : toast.type === 'error' ? 'var(--rose)' : 'var(--accent)' }}>
            [{toast.type}]
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
