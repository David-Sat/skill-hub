# Skill Hub

Unified Skill & MCP Manager for AI Coding Agents.

[![npm version](https://img.shields.io/npm/v/skill-hub.svg)](https://www.npmjs.com/package/skill-hub)
[![CI](https://github.com/David-Sat/skill-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/David-Sat/skill-hub/actions/workflows/ci.yml)
[![CodeQL](https://github.com/David-Sat/skill-hub/actions/workflows/codeql.yml/badge.svg)](https://github.com/David-Sat/skill-hub/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/npm/l/skill-hub.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-38bdf8.svg)](https://modelcontextprotocol.io)
[![Agent Plugins](https://img.shields.io/badge/Agent%20Plugin-Standard-6366f1.svg)](https://agent-plugins.org/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20%7C%20Zero%20Telemetry-purple.svg)](./PRIVACY.md)

> [!NOTE]
> **Security & Privacy Guarantee**: `skill-hub` runs **100% locally** on `127.0.0.1` and communicates with coding agents via standard `stdio` (MCP). There is **zero telemetry**, no tracking pixels, and no remote analytics. Registry checks are unauthenticated read-only calls directly to public NPM, PyPI, and GitHub APIs. Audited in [PRIVACY.md](./PRIVACY.md) and [SECURITY.md](./SECURITY.md).

Skill Hub scans all installed coding agent harnesses across your machine—showing what skills and MCP servers are active, profiling their context window token footprint, inspecting bundled helper scripts, and letting you 1-click update outdated MCP packages.

---

## Quickstart

| Method | Command | Best For |
| --- | --- | --- |
| **Instant / Ephemeral** | `npx skill-hub` | Launch web dashboard in 100ms without installing |
| **Terminal Audit** | `npx skill-hub audit` | Fast terminal ASCII overview of active harnesses & tokens |
| **In Agent** | `/skills` | In-chat audit & dashboard trigger |
| **Global Setup** | `npm i -g skill-hub && skill-hub init -g` | Interactive setup for Cursor, Antigravity, Claude, Windsurf |

<details>
<summary><strong>Interactive Global Installer</strong></summary>

Running `skill-hub init -g` provides an interactive checklist of detected coding tools:
```text
⚡ Skill Hub Installer

Detected coding agent harnesses on this machine:
  1. [●] Google Antigravity
  2. [●] Claude Code
  3. [●] Claude Desktop
  4. [●] Cursor
  5. [●] Windsurf
  6. [●] Cline
  7. [●] Roo Code

Configure skill-hub for detected harnesses? [Y/n]
```

* **Non-interactive / CI**: `skill-hub init -g -y` (auto-configures detected tools)
</details>

---

## Core Capabilities

### 1. Cross-Harness Matrix
Automatically detects and aggregates skills and MCPs across:
* **Google Antigravity**: `~/.gemini/` (`config/plugins/`, `config/skills/`, builtin skills)
* **Claude Code**: `~/.claude/` (skills, plugins, `.claude.json`)
* **Claude Desktop**: macOS `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows `%APPDATA%/Claude`, Linux `~/.config/Claude`
* **Cursor**: `~/.cursor/mcp.json`, project `.cursor/mcp.json`, `.cursor/rules/*.mdc`
* **Windsurf**: `~/.codeium/windsurf/mcp_config.json`, `.windsurfrules`
* **Cline & Roo Code**: VS Code `globalStorage` settings and `.clinerules`

### 2. Context Window & Token Profiler
Never wonder why your context window is filling up before your conversation even starts:
* **BPE Token Estimates**: Accurately computes token costs for `SKILL.md` files and rule sets.
* **Context Weight Tiers**:
  * 🟢 **Lean**: `< 1,000 tokens`
  * 🟡 **Moderate**: `1,000 – 4,000 tokens`
  * 🔴 **Heavy**: `> 4,000 tokens`
* **Metrics**: Line counts, character counts, and word counts.

### 3. Bundled Asset Explorer
Many advanced skills bundle helper scripts (`.py`, `.sh`, `.mjs`), JSON schemas, and reference documents. Skill Hub lists the entire bundled file tree with file sizes and roles without needing to search hidden filesystem folders.

### 4. 1-Click MCP Updater
Stale MCP packages break when upstream APIs evolve:
* Detects package managers (`npx`, `uvx`, `pip`, `docker`).
* Checks NPM, PyPI, and GitHub releases concurrently.
* **1-Click Update**: Automatically bumps the pinned version in your config files (`mcp.json`) while preserving all existing formatting and saving a timestamped backup to `~/.skill-hub/backups/`.

### 5. In-Agent Integration (`/skills`)
Skill Hub exposes standard MCP tools to your AI agent:
* `skill_hub_audit`: Returns a markdown summary of active harnesses and heavy skills.
* `skill_hub_launch_ui`: Launches the web dashboard and opens your browser.
* `skill_hub_list_skills`: Query skills programmatically.
* `skill_hub_update_mcp`: Update package versions programmatically.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       SKILL HUB                             │
├──────────────────────────────┬──────────────────────────────┤
│ CLI / AGENT ENTRY            │ EMBEDDED PREACT DASHBOARD    │
│ • Terminal: npx skill-hub    │ • 127.0.0.1:4350 (28 KB JS)  │
│ • In-Agent: /skills          │ • Token gauges & File tree   │
│ • MCP stdio: skill-hub mcp   │ • 1-Click Update triggers    │
├──────────────────────────────┴──────────────────────────────┤
│ LOCAL CORE ENGINE (Node / TypeScript)                       │
│ ├── scanner:  Cross-platform harness & config discovery     │
│ ├── profiler: BPE token weighting & asset classification    │
│ ├── updater:  Concurrent NPM/PyPI/GitHub version checks     │
│ └── server:   Zero-dependency local HTTP server             │
└─────────────────────────────────────────────────────────────┘
```

---

## License

MIT © [David Satomi](https://github.com/David-Sat)
