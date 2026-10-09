---
name: awesomeb-release
description: >
  Creates a new release for AwesomeB: bumps the version in package.json,
  updates outdated dependencies (explicitly skipping typescript to avoid the
  TS 7 incompatibility), commits with the chore(release) convention, pushes
  the branch, and opens a PR following the repo template.
  Trigger: When the user says "create a release", "new release", "bump version",
  "lanzar release", "nueva versión", "crear release", or any equivalent
  phrasing requesting a version bump and PR.
license: Apache-2.0
metadata:
  author: francescarpi
  version: "1.0"
allowed-tools: Bash, Read, Edit, Glob, Grep, question
---

## When to Use

- When the user explicitly asks for a new release / version bump
- **NEVER** auto-invoke this skill. The user must opt in.

## Critical Patterns

### Hard Rules (never violate)

1. **NEVER** use `--no-verify`, `--no-hooks`, or any equivalent hook-bypass
   flag on `git commit` / `git push`. The repo's husky + commitlint + lint-staged
   hooks are the user's safety net (see root `AGENTS.md`). If a hook fails,
   STOP, report the error, and let the user decide.
2. **NEVER** run the `awesomeb-docs-check` skill. Dependency bumps and version
   bumps are explicitly listed in `awesomeb-docs-check/SKILL.md` under
   "Changes That Do NOT Require Doc Updates". Running it is wasted work.
3. **NEVER** touch `typescript` and its version during this skill. The repo
   pins `typescript: 6.0.3` because TS 7 breaks other packages in the lockfile
   that are not yet TS-7-ready. If `pnpm outdated` shows a typescript bump,
   always skip it and call it out in the report.
4. The commit message **MUST** use the colon form: `chore(release): bump version to <version>`.
   The form `chore(release) bump version to <version>` (no colon) is **rejected by
   commitlint** (`@commitlint/config-conventional`). The skill writes the message
   directly — do not let the user paste a malformed subject.
5. Preserve the `-alpha` pre-release suffix. All historical releases use it
   (`0.14.20-alpha` → `0.14.25-alpha` at the time of writing). Manual override
   to `beta` / `rc` / final is out of scope for this skill.
6. Stay on `main` as the base. Do not base the release branch on any other branch.
7. The PR title **MUST** be `Bump version to <version>` — uppercase `B`, no
   Conventional Commits prefix. The `lint-pr-title` job in
   `.github/workflows/pr-checks.yml` rejects anything else.

### Version Bump Decision

The skill ALWAYS asks the user. Do not auto-decide.

| User choice | When | Example transition |
|---|---|---|
| **patch** | Bug fix or minor change | `0.14.25-alpha` → `0.14.26-alpha` |
| **minor** | New feature or major change | `0.14.25-alpha` → `0.15.0-alpha` |

There is no "major" bump in this skill — the project is pre-1.0 and a real
major bump (e.g. `0.14.25-alpha` → `1.0.0`) is a manual decision outside this flow.

### PR Body Requirements

Even though the user said "body = title" in casual conversation, the repo
template at `.github/PULL_REQUEST_TEMPLATE.md` requires `## Summary` and
`## Checklist` sections. The `## Linked issue` section is exempt for
release/version-bump PRs per the template's own comment. Always populate:

```markdown
## Summary

- Bump version to <new-version>
- Update outdated dependencies (excluding typescript)

## Linked issue

N/A — version-bump / release PR per template exception.

## Checklist

- [x] PR title is a plain-English sentence (starts with uppercase, no `feat:`/`fix:` prefix)
- [ ] Manually tested the change
```

## Workflow

### Step 0 — Pre-flight Checks

Run all of these. If any fails, STOP and surface the issue to the user.

```bash
# Clean working tree
git status --porcelain
# → must be empty. If not: STOP, ask user to commit/stash/discard.

# Current branch
git branch --show-current
# → if not 'main': run `git checkout main`.

# Sync main with remote
git fetch origin main
git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
# → tracking must be 'origin/main'. If not, set it.
# If behind: `git pull --ff-only` (avoids merge commits).

# gh CLI authenticated
gh auth status
# → if not authenticated: STOP, tell user to run `gh auth login`.
```

Read the current version:

```bash
grep '"version"' package.json
```

Report state to the user:

```
[release] Current version: 0.14.25-alpha
[release] Base branch 'main' is up-to-date with origin/main.
[release] Working tree is clean.
[release] gh CLI is authenticated as <user>.
[release] Proceed? [y/N]
```

### Step 1 — Decide Next Version

Ask the user (use the `question` tool):

> "Is this release a **patch** (bug fix / minor change → e.g. `0.14.26-alpha`)
> or **minor** (new feature / major change → e.g. `0.15.0-alpha`)?"

Calculate the next version from the current one, preserving `-alpha`. Show
the user the proposed branch name and confirm:

```
[release] Next version: 0.14.26-alpha
[release] Branch: chore/v0.14.26-alpha
[release] Proceed? [y/N]
```

### Step 2 — Create Branch

```bash
# Ensure we're on main
git checkout main

# Create the release branch
git checkout -b chore/v<new-version>
```

If the branch already exists, STOP and ask the user (do not delete or reuse).

### Step 3 — Bump `package.json` Version

Use the `Edit` tool, not `sed` — sed escaping around the JSON is error-prone.

- Find: `"version": "<old-version>"`
- Replace: `"version": "<new-version>"`

Verify:

```bash
grep '"version"' package.json
# → must show the new version
```

### Step 4 — Detect and Bump Outdated Dependencies

Run:

```bash
pnpm outdated
```

Parse the output. For each outdated package, mark `typescript` explicitly as
`[SKIPPED]`. Present a clean table to the user:

```
[release] Outdated packages detected:
  - astro: 7.3.8 → 8.x.x  (devDep)
  - electron: 44.7.0 → 45.x.x  (devDep)
  - typescript: 6.0.3 → 7.x.x  (devDep)  [SKIPPED — TS 7 incompatible]

Bump N packages (excluding typescript)? [y/N]
```

If the user confirms, bump each non-`typescript` package to its latest version.
Prefer `pnpm add` with an explicit `@latest` so the version in `package.json`
is pinned to latest (not a range):

```bash
# devDependencies
pnpm add -D <pkg1>@latest <pkg2>@latest ...

# dependencies (if any are outdated)
pnpm add <pkg1>@latest <pkg2>@latest ...
```

If `pnpm outdated` returned no packages (or only `typescript`), skip this step
entirely and proceed to Step 5.

If any `pnpm add` fails, STOP and report the exact error. Do not roll back
manually — let the user decide.

After bumping, re-run `pnpm outdated` to confirm everything that should have
been bumped is now current (only `typescript` should remain, if applicable).

### Step 5 — Commit

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(release): bump version to <new-version>"
```

- No commit body (matches the historical convention in `git log`).
- Do NOT pass `--no-verify`. Let husky's commit-msg hook run commitlint.
- If commitlint rejects the message: STOP, report the error, do not retry with
  a malformed message. The colon form must always be used.

If lint-staged triggers (it won't, because we only staged `package.json` and
`pnpm-lock.yaml` and lint-staged only watches `src/**/*`), let it run.

### Step 6 — Push and Create PR

```bash
git push -u origin chore/v<new-version>
```

Build the PR body from the template (see "PR Body Requirements" above).

Open the PR:

```bash
gh pr create \
  --title "Bump version to <new-version>" \
  --body "$(cat <<'EOF'
## Summary

- Bump version to <new-version>
- Update outdated dependencies (excluding typescript)

## Linked issue

N/A — version-bump / release PR per template exception.

## Checklist

- [x] PR title is a plain-English sentence (starts with uppercase, no `feat:`/`fix:` prefix)
- [ ] Manually tested the change
EOF
)"
```

Print the resulting PR URL to the user.

### Step 7 — Final Report

```
[release] ✅ Done.
[release]   Branch: chore/v<new-version>
[release]   Commit: <short-sha> chore(release): bump version to <new-version>
[release]   PR:     <url>
[release]   Bumped: <list of packages, or "no outdated packages">
[release]   Skipped: typescript (per repo rule)
```

## STOP Conditions (summary)

STOP and ask the user if any of these occur:

- Working tree is dirty at Step 0
- `gh auth status` reports not authenticated
- `main` cannot be fast-forwarded (`git pull --ff-only` fails) — likely a
  divergent history; user must resolve manually
- The release branch already exists
- `pnpm add` fails for any reason
- commitlint or any other husky hook rejects the commit
- `gh pr create` fails

Never auto-resolve. Never bypass hooks.

## Common Pitfalls

- **Forgetting the `:` in `chore(release):`** — the #1 mistake. The skill writes
  the subject directly; do not let the user paste a hand-typed message.
- **Bumping `typescript`** — pinned to 6.0.3 for a reason. The skill filters
  it out at Step 4, but verify before committing.
- **Basing the branch on the wrong base** — always `git checkout main` first.
  If you accidentally based on a feature branch, the user will see unrelated
  diffs in the release PR.
- **Populating `## Linked issue` with a fake issue** — the template comment
  explicitly says release PRs are exempt. Use `N/A — version-bump / release PR
  per template exception.`
- **Running `awesomeb-docs-check`** — wastes time, no docs changes are needed
  for a version bump. Skip it.
- **Letting lint-staged run `pnpm astro check` / `pnpm tscheck` on huge
  refactors** — not a concern here (we only stage `package.json` and the
  lockfile, both outside lint-staged's `src/**` glob).

## Resources

- `package.json` — source of the current `version` field
- `.github/PULL_REQUEST_TEMPLATE.md` — PR body template
- `AGENTS.md` (root) — commit/PR rules, hook policy
- `.opencode/skills/awesomeb-docs-check/SKILL.md` — reference for what does
  NOT need docs (cited under Hard Rules)
- `git log --oneline | grep 'chore(release)'` — historical release commits
  for format reference
