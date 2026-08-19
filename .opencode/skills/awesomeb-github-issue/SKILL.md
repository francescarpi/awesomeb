---
name: awesomeb-github-issue
description: >
  Creates GitHub issues (bug reports or feature requests) for the AwesomeB repo using its templates.
  Interaction in Spanish (peninsular), issue created in English via gh CLI.
  Trigger: When user says "create a bug", "create a feature", "report a bug", "suggest a feature", "creemos un bug", "creemos una feature", "reportar un bug".
license: Apache-2.0
metadata:
  author: francescarpi
  version: "1.0"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task, question
---

## When to Use

- User wants to report a bug: "creemos un bug", "report a bug", "found a bug"
- User wants to request a feature: "creemos una feature", "suggest a feature", "quiero una feature"
- Any variation in Spanish or English indicating bug report or feature request

## Critical Patterns

### Language Rules
- **Interaction with user**: Spanish (español de la península) — directo, sin rodeos
- **GitHub issue content**: English only — title, body, all template fields in English

### Repo Detection
- Run `git remote -v` in current workspace
- Extract `OWNER/REPO` from origin remote (e.g., `francescarpi/awesomeb`)
- Use `-R` flag in `gh issue create`

### Template Mapping
| User Intent | Template Name | Label | Title Prefix |
|-------------|---------------|-------|--------------|
| Bug | "Bug report" | bug | "[Bug]: " |
| Feature | "Feature request" | enhancement | "[Feature]: " |

### Required Fields (from templates)

**Bug Report** (all required per template):
1. `description` — Clear bug description
2. `reproduction` — Steps to reproduce
3. `expected` — Expected behavior
4. `version` — AwesomeB version
5. `os` — Operating System (macOS/Windows/Linux)

**Feature Request** (required: solution; optional: problem, alternatives, context):
1. `solution` — Describe the solution you'd like (REQUIRED)
2. `problem` — Is your feature request related to a problem?
3. `alternatives` — Describe alternatives you've considered
4. `context` — Additional context / mockups

## Workflow

### Step 1: Detect Type
```
IF user says "bug", "error", "falla", "bug", "problema" → BUG
IF user says "feature", "funcionalidad", "mejora", "feature", "nueva" → FEATURE
IF ambiguous → ASK: "¿Es un bug o una feature nueva?"
```

### Step 2: Ask Questions (Spanish)
Use `question` tool for each required field. Present as conversational flow.

**Bug Questions:**
1. "¿Qué está pasando? Describe el bug en una frase"
2. "¿Cómo lo reproduzco? Pasos paso a paso (1., 2., 3.)"
3. "¿Qué esperabas que pasara? (comportamiento correcto)"
4. "¿Qué versión de AwesomeB tienes? (ej: 0.1.0)"
5. "¿En qué SO estás? (macOS / Windows / Linux)"

**Feature Questions:**
1. "¿Qué problema resuelve esta feature? (si aplica)"
2. "¿Cómo te gustaría que funcione? Describe la solución"
3. "¿Pensaste en alternativas? (opcional)"
4. "¿Algo más para agregar? Mockups, links, contexto (opcional)"

### Step 3: Translate to English
Internally translate all user responses to English for the issue body.

### Step 4: Build gh Command
```bash
# Bug
gh issue create -R <owner/repo> -T "Bug report" -t "[Bug]: <title>" -b "<body>" -l "bug"

# Feature
gh issue create -R <owner/repo> -T "Feature request" -t "[Feature]: <title>" -b "<body>" -l "enhancement"
```

### Step 5: Execute & Show Result
Run command, capture output, show issue URL to user.

## Code Examples

### Detect Repo
```bash
# Extract owner/repo from git remote
git remote get-url origin | sed -E 's/.*github.com[:\/](.+)\.git/\1/'
# Output: francescarpi/awesomeb
```

### Build Body (Bug)
```markdown
## Bug description
<description>

## Steps to reproduce
<reproduction>

## Expected behavior
<expected>

## AwesomeB version
<version>

## Operating System
<os>

## OS version
<os-version>

## Relevant logs / console output
<logs or "N/A">

## Screenshots
<screenshots or "N/A">
```

### Build Body (Feature)
```markdown
## Is your feature request related to a problem?
<problem or "N/A">

## Describe the solution you'd like
<solution>

## Describe alternatives you've considered
<alternatives or "N/A">

## Additional context / mockups
<context or "N/A">
```

## Commands

```bash
# Verify gh auth
gh auth status

# Detect repo
git remote get-url origin | sed -E 's/.*github.com[:\/](.+)\.git/\1/'

# Create bug issue
gh issue create -R francescarpi/awesomeb -T "Bug report" -t "[Bug]: Tab closes unexpectedly when dragging" -b "## Bug description\nTab closes when dragging..." -l "bug"

# Create feature issue
gh issue create -R francescarpi/awesomeb -T "Feature request" -t "[Feature]: Add split-tab view" -b "## Is your feature request related to a problem?\n..." -l "enhancement"
```

## Resources

- **Templates**: `.github/ISSUE_TEMPLATE/bug_report.yml`, `.github/ISSUE_TEMPLATE/feature_request.yml`
- **Repo**: `francescarpi/awesomeb` (auto-detected from git remote)

## Notes

- Blank issues disabled in repo config — MUST use templates
- `gh` must be authenticated (`gh auth status`)
- If gh not available → fallback: generate markdown for manual copy/paste
- All user-facing text in Spanish, issue content in English