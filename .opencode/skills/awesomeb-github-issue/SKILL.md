---
name: awesomeb-github-issue
description: >
  Creates GitHub issues (bug reports or feature requests) for the AwesomeB repo using its templates.
  Interaction language matches user's language; issue created in English via gh CLI.
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
- **Interaction with user**: Match the user's language. If they write in Spanish, respond in Spanish (peninsular, directo). If English, respond in English.
- **GitHub issue content**: **ALWAYS English** — title, body, all template fields in English. No exceptions.

### Repo Detection
- Run `git remote -v` in current workspace
- Extract `OWNER/REPO` from origin remote (e.g., `francescarpi/awesomeb`)
- Use `-R` flag in `gh issue create`

### Template Mapping
| User Intent | Template Name | Label | Title Prefix | Template File |
|-------------|---------------|-------|--------------|---------------|
| Bug | "Bug report" | bug | "[Bug]: " | `.github/ISSUE_TEMPLATE/bug_report.yml` |
| Feature | "Feature request" | enhancement | "[Feature]: " | `.github/ISSUE_TEMPLATE/feature_request.yml` |

### Template-Driven Fields (read dynamically)
**DO NOT hardcode fields.** Read from template YAML files at runtime:

```bash
# Parse bug template
yq '.body[] | select(.id) | {id, label, required: .validations.required // false, type}' .github/ISSUE_TEMPLATE/bug_report.yml

# Parse feature template
yq '.body[] | select(.id) | {id, label, required: .validations.required // false, type}' .github/ISSUE_TEMPLATE/feature_request.yml
```

Expected field IDs from templates:

**Bug Report** (`bug_report.yml`):
- `description` (textarea, required) — "Bug description"
- `reproduction` (textarea, required) — "Steps to reproduce"
- `expected` (textarea, required) — "Expected behavior"
- `version` (input, required) — "AwesomeB version"
- `os` (dropdown, required) — "Operating System" [macOS, Windows, Linux]
- `os-version` (input, optional) — "OS version"
- `logs` (textarea, optional) — "Relevant logs / console output"
- `screenshots` (textarea, optional) — "Screenshots (optional)"

**Feature Request** (`feature_request.yml`):
- `problem` (textarea, optional) — "Is your feature request related to a problem?"
- `solution` (textarea, required) — "Describe the solution you'd like"
- `alternatives` (textarea, optional) — "Describe alternatives you've considered"
- `context` (textarea, optional) — "Additional context / mockups"

## Workflow

### Step 1: Detect Type
```
IF user says "bug", "error", "falla", "bug", "problema" → BUG
IF user says "feature", "funcionalidad", "mejora", "feature", "nueva" → FEATURE
IF ambiguous → ASK: "¿Es un bug o una feature nueva?"
```

### Step 2: Read Template & Ask Questions
1. Read the appropriate template YAML file
2. Extract fields with `id`, `label`, `required`, `type`, `options` (for dropdowns)
3. For each field with `id` (skip markdown/checkboxes), ask user **in their language**
4. Map user's response to field ID for body construction

**Bug Questions (ask in user's language):**
1. `description` → "What's happening? Describe the bug in one sentence" / "¿Qué está pasando? Describe el bug en una frase"
2. `reproduction` → "How do I reproduce it? Step by step (1., 2., 3.)" / "¿Cómo lo reproduzco? Pasos paso a paso (1., 2., 3.)"
3. `expected` → "What did you expect to happen? (correct behavior)" / "¿Qué esperabas que pasara? (comportamiento correcto)"
4. `version` → "What AwesomeB version? (e.g. 0.1.0)" / "¿Qué versión de AwesomeB tienes? (ej: 0.1.0)"
5. `os` → "What OS? (macOS / Windows / Linux)" / "¿En qué SO estás? (macOS / Windows / Linux)"
6. `os-version` → "OS version? (e.g. macOS 14.5) — optional" / "¿Versión del SO? (ej: macOS 14.5) — opcional"
7. `logs` → "Relevant logs or console output? — optional" / "¿Logs relevantes o salida de consola? — opcional"
8. `screenshots` → "Screenshots? — optional" / "¿Capturas de pantalla? — opcional"

**Feature Questions (ask in user's language):**
1. `problem` → "What problem does this solve? (if applicable)" / "¿Qué problema resuelve esta feature? (si aplica)"
2. `solution` → "How would you like it to work? Describe the solution" / "¿Cómo te gustaría que funcione? Describe la solución"
3. `alternatives` → "Alternatives considered? (optional)" / "¿Pensaste en alternativas? (opcional)"
4. `context` → "Anything else? Mockups, links, context (optional)" / "¿Algo más para agregar? Mockups, links, contexto (opcional)"

### Step 3: Translate to English
Internally translate all user responses to English for the issue body.

### Step 4: Build Body from Template Fields
Construct markdown body matching template field order and labels exactly:

**Bug Body Format:**
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
<logs>

## Screenshots
<screenshots>
```

**Feature Body Format:**
```markdown
## Is your feature request related to a problem?
<problem>

## Describe the solution you'd like
<solution>

## Describe alternatives you've considered
<alternatives>

## Additional context / mockups
<context>
```

Leave empty fields as "N/A" or omit optional ones.

### Step 5: Execute gh Command
```bash
# Bug
gh issue create -R <owner/repo> -T "Bug report" -t "[Bug]: <title>" -b "<body>" -l "bug"

# Feature
gh issue create -R <owner/repo> -T "Feature request" -t "[Feature]: <title>" -b "<body>" -l "enhancement"
```

### Step 6: Show Result
Run command, capture output, show issue URL to user.

## Code Examples

### Detect Repo
```bash
git remote get-url origin | sed -E 's/.*github.com[:\/](.+)\.git/\1/'
# Output: francescarpi/awesomeb
```

### Parse Template Fields (using yq)
```bash
# Bug template fields
yq '.body[] | select(.id) | {id: .id, label: .attributes.label, required: .validations.required // false, type: .type, options: .attributes.options // []}' .github/ISSUE_TEMPLATE/bug_report.yml

# Feature template fields
yq '.body[] | select(.id) | {id: .id, label: .attributes.label, required: .validations.required // false, type: .type, options: .attributes.options // []}' .github/ISSUE_TEMPLATE/feature_request.yml
```

## Commands

```bash
# Verify gh auth
gh auth status

# Detect repo
git remote get-url origin | sed -E 's/.*github.com[:\/](.+)\.git/\1/'

# Create bug issue (example)
gh issue create -R francescarpi/awesomeb -T "Bug report" -t "[Bug]: Tab closes unexpectedly when dragging" -b "## Bug description\nTab closes when dragging..." -l "bug"

# Create feature issue (example)
gh issue create -R francescarpi/awesomeb -T "Feature request" -t "[Feature]: Add split-tab view" -b "## Is your feature request related to a problem?\n..." -l "enhancement"
```

## Resources

- **Templates**: `.github/ISSUE_TEMPLATE/bug_report.yml`, `.github/ISSUE_TEMPLATE/feature_request.yml`
- **Repo**: `francescarpi/awesomeb` (auto-detected from git remote)

## Notes

- Blank issues disabled in repo config — MUST use templates
- `gh` must be authenticated (`gh auth status`)
- If gh not available → fallback: generate markdown for manual copy/paste
- Interaction language matches user's language, issue content ALWAYS in English
- **Template fields are source of truth** — read YAML at runtime, don't hardcode