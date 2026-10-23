# ( ಠ_ಠ ) SkillDesk

Unified Skill & MCP Manager for AI Coding Agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-38bdf8.svg)](https://modelcontextprotocol.io)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20%7C%20Zero%20Telemetry-purple.svg)](./PRIVACY.md)

> [!NOTE]
> **Security & Privacy Guarantee**: `skilldesk` runs **100% locally** on `127.0.0.1` and communicates with coding agents via standard `stdio` (MCP). There is **zero telemetry**, no tracking pixels, and no remote analytics. Registry checks are unauthenticated read-only calls directly to public NPM, PyPI, and GitHub APIs. Audited in [PRIVACY.md](./PRIVACY.md) and [SECURITY.md](./SECURITY.md).

SkillDesk scans all installed coding agent harnesses across your machine—showing what skills and MCP servers are active, profiling their startup context window token footprint, inspecting bundled helper scripts, safely removing unused skills with automated backups, and letting you 1-click update outdated MCP packages.

---

## Quickstart

| Method | Command | Purpose |
| --- | --- | --- |
| **Instant Dashboard** | `npx skilldesk` | Launch local web dashboard at `http://127.0.0.1:4350` |
| **Terminal Audit** | `npx skilldesk audit` | Fast terminal ASCII overview of active harnesses & tokens |
| **In Agent** | `/skills` | In-chat audit & dashboard trigger |
| **Global Setup** | `npm i -g skilldesk && skilldesk init -g` | Interactive setup for Antigravity, Claude Code, Cursor, Windsurf |

*(Both `skilldesk` and `skill-desk` command invocations are supported)*

---

## Core Capabilities

* **Cross-Harness Discovery**: Detects active skills and MCP servers across Antigravity, Claude Code, Cursor, and Windsurf in one unified view.
* **Turn-0 Context Profiler**: Measures startup token overhead and flags heavyweight skill descriptions before they bloat agent context.
* **Safe Skill Removal**: Removes unwanted skills with automated, timestamped safety backups.
* **1-Click MCP Updates**: Scans NPM, PyPI, and GitHub registries to upgrade outdated server configs.
* **In-Agent Tooling**: Native MCP tools and in-chat slash commands directly inside your AI coding sessions.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                         SKILLDESK                           │
├──────────────────────────────┬──────────────────────────────┤
│ CLI / AGENT ENTRY            │ EMBEDDED PREACT DASHBOARD    │
│ • Terminal: npx skilldesk    │ • 127.0.0.1:4350 (28 KB JS)  │
│ • In-Agent: /skills          │ • Token gauges & File tree   │
│ • MCP stdio: skilldesk mcp   │ • 1-Click Update triggers    │
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
