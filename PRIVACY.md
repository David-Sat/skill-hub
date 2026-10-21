# Privacy Policy for Skill Hub

**Effective Date:** October 21, 2026  
**Last Updated:** October 21, 2026  

`skill-hub` ("Skill Hub", "we", "our") is an open-source skill and Model Context Protocol (MCP) manager for AI coding agents. We believe developer tools should operate transparently with zero unexpected data collection.

---

## 1. Zero Telemetry & No Tracking

`skill-hub` does not collect, track, store, or transmit any personal data, usage metrics, or telemetry.
* There are **no analytics services** or tracking pixels bundled with Skill Hub.
* There is **no crash reporting** sent to external servers.
* We do not monitor what skills you install, how often you use Skill Hub, what files you inspect, or what commands you run.

---

## 2. 100% Local Execution

* **Local-First Architecture:** The Skill Hub server runs exclusively on your local machine (`127.0.0.1` / `localhost`).
* **No Remote Cloud Backends:** No network requests are made to any proprietary cloud servers.
* **Registry Checks Only:** When you explicitly click "Check Updates" or run `skill-hub audit --check-updates`, Skill Hub sends standard unauthenticated `GET` queries directly to public open package registries (`registry.npmjs.org`, `pypi.org`, and public GitHub APIs) to check version numbers.
* **Local MCP stdio:** Communication between Skill Hub and your AI coding agents (Claude Code, Cursor, Antigravity, Windsurf, Cline, etc.) takes place entirely on your device over standard input/output (`stdio`) via the Model Context Protocol (MCP).

---

## 3. Local Data Storage & Backups

Before any configuration file is updated or any skill file is edited, Skill Hub creates an automated timestamped backup strictly on your local filesystem:

```text
~/.skill-hub/
  └── backups/
```

You maintain complete ownership and control over this data at all times. You can inspect or delete the `~/.skill-hub/` directory whenever you choose.

---

## 4. Open Source Transparency

The complete source code for `skill-hub` is publicly auditable on GitHub:  
[https://github.com/David-Sat/skill-hub](https://github.com/David-Sat/skill-hub)
