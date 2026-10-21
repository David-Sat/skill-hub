---
name: skill-hub
description: Unified Skill & MCP Manager for AI Coding Agents. Use when the user asks to inspect installed skills, audit context token weights, review MCP servers, or check for updates. Also triggered by /skills or /skill-hub.
---

# Skill Hub: Unified Skill & MCP Manager

Skill Hub gives you complete visibility over installed agent harnesses (Google Antigravity, Claude Code, Cursor, Windsurf, Cline, Roo Code, Claude Desktop), measuring prompt token consumption, bundled assets, and detecting upstream updates.

## Workflow for `/skills` or Skill Hub Queries

When the user runs `/skills`, `/skill-hub`, or asks about their installed skills or MCP configurations:

### 1. Perform a Fast Audit
Call `skill_hub_audit` to retrieve active harnesses, total skill count, oversized skills, and pending updates:

```json
{
  "name": "skill_hub_audit"
}
```

Respond with a concise summary of:
- Detected harnesses
- Number of active skills and MCPs
- Any **heavyweight skills** (> 4,000 tokens) that might be inflating their context window
- Any **outdated MCP packages** or skills with newer releases available

### 2. Launch the Visual Dashboard
When the user wants to visually browse their skills, read full instructions, inspect bundled script directories, or click to update MCP versions:

```json
{
  "name": "skill_hub_launch_ui"
}
```

Tell the user:
"I opened your Skill Hub dashboard at `http://127.0.0.1:4350`. You can inspect all installed skills, explore bundled assets, and 1-click update outdated MCPs."
