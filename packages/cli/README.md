# ( ಠ_ಠ ) Skill Hub

Unified Skill & MCP Manager for AI Coding Agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-38bdf8.svg)](https://modelcontextprotocol.io)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20%7C%20Zero%20Telemetry-purple.svg)](./PRIVACY.md)

> [!NOTE]
> **Security & Privacy Guarantee**: `skill-hub` runs **100% locally** on `127.0.0.1` and communicates with coding agents via standard `stdio` (MCP). There is **zero telemetry**, no tracking pixels, and no remote analytics. Registry checks are unauthenticated read-only calls directly to public NPM, PyPI, and GitHub APIs. Audited in [PRIVACY.md](./PRIVACY.md) and [SECURITY.md](./SECURITY.md).

Skill Hub scans all installed coding agent harnesses across your machine—showing what skills and MCP servers are active, profiling their startup context window token footprint, inspecting bundled helper scripts, safely removing unused skills with automated backups, and letting you 1-click update outdated MCP packages.

---

## Quickstart

| Method | Command | Purpose |
| --- | --- | --- |
| **Instant Dashboard** | `npx skill-hub` | Launch web dashboard at `http://127.0.0.1:4350` |
| **Terminal Audit** | `npx skill-hub audit` | Fast terminal ASCII overview of active harnesses & tokens |
| **In Agent** | `/skills` | In-chat audit & dashboard trigger |
| **Global Setup** | `npm i -g skill-hub && skill-hub init -g` | Interactive setup for Antigravity, Claude Code, Cursor, Windsurf |

---

## Core Capabilities

* **Cross-Harness Discovery**: Aggregates active skills and MCP servers across installed harnesses (Google Antigravity, Claude Code, Claude Desktop, Cursor, Windsurf) in one view.
* **Startup Context Profiler**: Inspects the exact system prompt block (`<skills>` XML or markdown list) injected on turn 0, calculates startup token overhead, and flags verbose descriptions (>100 tokens).
* **Token Weighting & Asset Explorer**: Profiles skill instructions with BPE token tiers (Lean, Moderate, Heavy) and explores bundled helper scripts (`.py`, `.sh`, `.mjs`), schemas, and references.
* **Safe Skill Removal**: Deletes unused skills with automated, timestamped backups archived to `~/.skill-hub/backups/`. Built-in harness skills are strictly protected.
* **1-Click MCP Updater**: Concurrently queries NPM, PyPI, and GitHub registries for outdated servers and updates pinned config versions safely.
* **In-Agent MCP Tooling**: Exposes `/skills` and native MCP tools (`skill_hub_audit`, `skill_hub_launch_ui`) directly inside your coding sessions.

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
