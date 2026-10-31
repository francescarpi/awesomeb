---
name: awesomeb-release
description: >
  Creates a new release for AwesomeB: bumps the version in package.json,
  updates outdated dependencies (explicitly skipping typescript to avoid the
  TS 7 incompatibility), fixes known security vulnerabilities with
  `pnpm audit --fix`, commits with the chore(release) convention, pushes
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
8. **NEVER** run `pnpm audit fix` (the interactive/commercial-audit command)
   and **NEVER** pass `--audit-level` or other audit flags that change the
   registry. Only `pnpm audit` (read) and `pnpm audit --fix` (the local
   `pnpm.overrides` fixer) are allowed. `pnpm audit fix` queries the paid
   advisory database and can rewrite `package.json` in ways this repo does
   not want.
9. **NEVER** let `pnpm audit --fix` remove the protected `pnpm.overrides`
   entries (`plist`, `devalue`, `node-abi`). They exist for build/runtime
   compatibility, not for security, so `--fix` prunes them as "obsolete" —
   and the build then breaks. See "Protected overrides" under Step 5.

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
- Fix known security vulnerabilities with `pnpm audit --fix`

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

### Step 5 — Fix Known Security Vulnerabilities

Run the audit **after** the dependency bumps, so the report reflects the
packages that will actually ship:

```bash
pnpm audit
```

Present the findings to the user. `pnpm audit` exits non-zero when
vulnerabilities exist, so ignore the exit code — the output is what matters.

```
[release] Security vulnerabilities detected: N (X high, Y moderate, Z low)
[release]   - tar <=7.5.20 → patched in 7.5.21  (GHSA-r292-9mhp-454m)
[release]   - brace-expansion >=4.0.0 <5.0.12 → patched in 5.0.12
[release]   ...

Fix with `pnpm audit --fix` (adds pnpm.overrides entries)? [y/N]
```

If the user confirms (or the user already asked for the audit fix up front),
apply it:

```bash
pnpm audit --fix
pnpm install
```

Important notes:

- **This repo has TWO override sources.** `pnpm.overrides` in
  `package.json` AND an `overrides:` block in `pnpm-workspace.yaml`. pnpm 10
  merges both, and the effective set is what lands in `pnpm-lock.yaml`.
  `pnpm audit --fix` only writes to `package.json`. Always check
  `pnpm-workspace.yaml` too when reviewing or restoring overrides.
- **Override keys are matched against the DECLARED range, not the resolved
  version.** `app-builder-lib` declares `tar: ^7.5.7`, so a
  `tar@<=7.5.20` override never applies to it — pnpm resolves `^7.5.7` to
  the newest matching release (7.5.20), which stays vulnerable. To force a
  transitive package past an advisory you need a **bare package name** key
  (e.g. `"tar": ">=7.5.21"`), which overrides every range of that package.
  Range-scoped keys only catch dependencies whose declared spec falls in
  that range.
- `pnpm audit --fix` does **not** touch the lockfile by itself — it only adds
  entries to `pnpm.overrides` in `package.json`. The subsequent `pnpm install`
  is what actually applies them to `pnpm-lock.yaml`. **Both commands are
  required**; skipping `pnpm install` leaves the vulnerabilities in place.
- **If the audit still reports a vulnerability after `--fix` + `install`, the
  lockfile is stale.** pnpm will not re-resolve an already-pinned transitive
  dependency just because a new override was added. Force a targeted
  re-resolution of just that package:

  ```bash
  pnpm update <package> --lockfile-only
  pnpm install
  ```

  Verify afterwards with `pnpm audit` — it must report no known
  vulnerabilities.

  **Do NOT delete `pnpm-lock.yaml` to force a re-resolution.** A full
  regeneration can drop optional peer dependencies that the build depends
  on — in this repo it dropped `vite@8.3.5`'s optional peer `esbuild`, and
  the build then died with
  `Failed to load 'transformWithEsbuild' ... Cannot find package 'esbuild'`.
  `pnpm update <package> --lockfile-only` re-resolves the one package and
  leaves the rest of the lockfile intact.
- `pnpm audit --fix` adds `pnpm.overrides` entries; it does not bump the
  declared version of any dependency in `package.json`. The `typescript` pin is
  never affected by it (audit fixes are transitive-range overrides).
- **ALWAYS review the `pnpm.overrides` diff after `--fix`.** `--fix` prunes
  entries it considers obsolete, but it has no knowledge of *why* an override
  exists. Overrides in this repo can be there for **compatibility**, not
  security — and removing them breaks the build. See "Protected overrides"
  below.
- Verify the result:

```bash
pnpm audit
```

- If `pnpm audit --fix` or `pnpm install` fails, STOP and report the exact
  error. Do not roll back manually — let the user decide.
- Some vulnerabilities cannot be auto-fixed (the audit output marks them
  `review` instead of `update`). Report the remaining count and the affected
  package paths in the final report so the user knows what is still open.

#### Protected overrides (never let `--fix` remove these)

`pnpm audit --fix` removes these entries from `package.json` because it does
not see an advisory against them. **They must be restored** — they are there
for build/runtime compatibility, not for security.

| Override | Why it exists | What breaks without it |
|---|---|---|
| `"plist": "3.1.1"` | `plist@3.1.0` calls `DOMParser.parseFromString(xml)` with no mimeType; `@xmldom/xmldom@0.9.12` (also overridden here) now requires the second argument. `plist@3.1.1` passes `"text/xml"`. | `pnpm build:mac` dies with `DOMParser.parseFromString: the provided mimeType "undefined" is not valid` during electron-builder packaging. Added by `fix(build): force plist 3.1.1 and APFS filesystem for macOS 26 (#366)`. |
| `"devalue@<5.9.1": ">=5.9.2"` | Astro/astro-icon transitive dep. | Astro build may fail on the affected version. |
| `"node-abi": "^4.39.0"` | Pins `node-abi` for native module rebuilds. | `@electron/rebuild` in electron-builder may pick an incompatible `node-abi` and fail the native rebuild step. Added by `fix(chore): update the node-abi version (#508)`. |

Restore them with the `Edit` tool right after running `--fix`:

```json
"overrides": {
  "plist": "3.1.1",
  "devalue@<5.9.1": ">=5.9.2",
  "node-abi": "^4.39.0",
  ...
}
```

Then re-run `pnpm install` to propagate the restored overrides to the lockfile.

**Sanity check before committing** — confirm the protected overrides survived:

```bash
node -e "const o=require('./package.json').pnpm.overrides; console.log('plist:',o.plist,'devalue:',o['devalue@<5.9.1'],'node-abi:',o['node-abi'])"
# → plist: 3.1.1 devalue: >=5.9.2 node-abi: ^4.39.0
```

If any of them is `undefined`, restore it before committing.

### Step 5b — Verify the Build Still Works

`pnpm audit --fix` changes transitive dependency versions, so the build can
break even when the audit report looks clean. Run the platform build before
committing:

```bash
pnpm build:mac    # or build:win / build:linux
```

Expected failures that are **NOT** caused by the dependency changes:

- `corrupted Electron dist` — the Electron dist in `release/mac-arm64` was
  extracted incompletely, usually because the disk was busy or the previous
  build was interrupted. Delete `release/` and re-run. Not a dependency
  problem.
- `hdiutil detach ... Unable to detach device cleanly` / `dmgbuild process
  failed 1` — the DMG volume could not be unmounted, typically because a
  mounted volume or another build holds the device busy. The `.app` bundle and
  the `.zip` target are already built at that point; only the DMG image is
  missing. Re-run the build, or report it to the user as an environment
  issue rather than a dependency problem.

Any **other** build failure after the audit fix is a real regression. Report
it to the user with the full error before committing.

### Step 5c — Verify the Checks Still Pass

**Never commit a release without running the repo's check suite.** The
release PR is validated by `.github/workflows/pr-checks.yml`, so anything
that fails here will fail CI too. Bumping `electron`, `eslint` or any
transitive dependency can break types, lint rules or tests even when the
build succeeds.

Run the same commands CI runs, in the same order:

```bash
pnpm astro check          # Astro / template type checking
pnpm tscheck:node         # main + preload TypeScript
pnpm tscheck:renderer     # renderer TypeScript
pnpm test run             # Vitest (use `run`, not watch mode)
pnpm lint                 # ESLint
pnpm exec prettier --check src   # formatting
```

Notes:

- Use `pnpm test run` — plain `pnpm test` starts Vitest in watch mode and
  will hang the session.
- `pnpm astro check` needs `node_modules` to be fully installed; run
  `pnpm install` first if it was skipped.
- These are the exact steps in `pr-checks.yml`. Keep them in sync if that
  workflow changes.

If **any** check fails, STOP and report it to the user with the full error
before committing. Do not commit a release that breaks CI. The usual cause
is a dependency bump that changed a type or a lint rule — report the failing
package and the error, and let the user decide whether to pin the
dependency or fix the code.

Only run this suite when the release actually changed dependencies
(Steps 4 or 5). For a pure version bump with no dependency changes, skip
straight to Step 6 — there is nothing that could have broken.

### Step 6 — Commit

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "chore(release): bump version to <new-version>"
```

- Stage `pnpm-workspace.yaml` too when it was modified — it carries the
  second `overrides:` source and must ship with the lockfile.
- No commit body (matches the historical convention in `git log`).
- Do NOT pass `--no-verify`. Let husky's commit-msg hook run commitlint.
- If commitlint rejects the message: STOP, report the error, do not retry with
  a malformed message. The colon form must always be used.

If lint-staged triggers (it won't, because we only staged `package.json`,
`pnpm-lock.yaml` and `pnpm-workspace.yaml`, and lint-staged only watches
`src/**/*`), let it run.

### Step 7 — Push and Create PR

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
- Fix known security vulnerabilities with `pnpm audit --fix`

## Linked issue

N/A — version-bump / release PR per template exception.

## Checklist

- [x] PR title is a plain-English sentence (starts with uppercase, no `feat:`/`fix:` prefix)
- [ ] Manually tested the change
EOF
)"
```

Print the resulting PR URL to the user.

### Step 8 — Final Report

```
[release] ✅ Done.
[release]   Branch: chore/v<new-version>
[release]   Commit: <short-sha> chore(release): bump version to <new-version>
[release]   PR:     <url>
[release]   Bumped: <list of packages, or "no outdated packages">
[release]   Skipped: typescript (per repo rule)
[release]   Audit:  <N fixed via pnpm.overrides> / <M still open — list package paths>
[release]   Overrides restored: plist, devalue, node-abi (protected)
[release]   Build:  <platform build result, or "not run">
[release]   Checks: <astro check, tscheck, test, lint, prettier — all pass | failed | not run>
```

## STOP Conditions (summary)

STOP and ask the user if any of these occur:

- Working tree is dirty at Step 0
- `gh auth status` reports not authenticated
- `main` cannot be fast-forwarded (`git pull --ff-only` fails) — likely a
  divergent history; user must resolve manually
- The release branch already exists
- `pnpm add` fails for any reason
- `pnpm audit --fix` or `pnpm install` fails for any reason
- A protected override (`plist`, `devalue`, `node-abi`) is missing from
  `pnpm.overrides` after the audit fix and cannot be restored
- The platform build fails with an error that is not a known environment
  issue (`corrupted Electron dist`, `hdiutil detach`)
- Any check in Step 5c fails (`astro check`, `tscheck:node`,
  `tscheck:renderer`, `test run`, `lint`, `prettier --check`)
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
- **Forgetting `pnpm install` after `pnpm audit --fix`** — `--fix` only writes
  `pnpm.overrides` into `package.json`; without the install the lockfile is
  unchanged and the vulnerabilities remain. Always run both, in that order.
- **Trusting `pnpm audit --fix` to preserve existing overrides** — it prunes
  the `plist`, `devalue` and `node-abi` overrides as obsolete, and the mac
  build then dies with `DOMParser.parseFromString: the provided mimeType
  "undefined" is not valid`. Always review the `pnpm.overrides` diff and
  restore the protected entries (see "Protected overrides").
- **Assuming a range-scoped override fixes a transitive advisory** — pnpm
  matches override keys against the dependency's **declared range**, not its
  resolved version. `tar@<=7.5.20` does nothing for a package declaring
  `tar: ^7.5.7`. Use a bare package-name key (`"tar": ">=7.5.21"`) to cover
  every range.
- **Trusting `pnpm install` to re-resolve a pinned transitive dependency** —
  it will happily keep the locked (vulnerable) version even after a new
  override is added, and the audit stays red. Use
  `pnpm update <package> --lockfile-only` to re-resolve just that package.
- **Deleting `pnpm-lock.yaml` to force a re-resolution** — it regenerates
  the whole graph and can silently drop optional peer deps the build needs
  (`vite` + `esbuild` broke `pnpm build:mac` this way). Always prefer a
  targeted `pnpm update <package> --lockfile-only`.
- **Only checking `package.json` for overrides** — this repo also has an
  `overrides:` block in `pnpm-workspace.yaml`, and pnpm merges both. The
  effective set is what ends up in `pnpm-lock.yaml`.
- **Using `pnpm audit fix` instead of `pnpm audit --fix`** — the former is a
  different command that hits the paid advisory database. Only
  `pnpm audit --fix` is allowed (see Hard Rules).
- **Treating `pnpm audit`'s non-zero exit code as a failure** — it exits 1
  whenever vulnerabilities exist. Read the report, don't gate on the exit code.
- **Treating `corrupted Electron dist` or a `hdiutil detach` failure as a
  dependency regression** — both are environment issues (interrupted build /
  busy disk), not package problems. The `.app` bundle and `.zip` target are
  already built when the DMG step fails.
- **Letting lint-staged run `pnpm astro check` / `pnpm tscheck` on huge
  refactors** — not a concern here (we only stage `package.json`,
  `pnpm-lock.yaml` and `pnpm-workspace.yaml`, all outside lint-staged's
  `src/**` glob).
- **Committing without running the Step 5c checks** — lint-staged does NOT
  cover this. It only watches `src/**/*`, so `package.json` and
  `pnpm-lock.yaml` changes skip type checks, tests and lint entirely. A
  dependency bump can break the build or the types and the commit would
  still succeed locally — it only fails later in CI. Run the suite
  explicitly before committing.
- **Running `pnpm test` instead of `pnpm test run`** — the bare script starts
  Vitest in watch mode and hangs the session.

## Resources

- `package.json` — source of the current `version` field, and the
  `pnpm.overrides` block that `pnpm audit --fix` writes to
- `pnpm-workspace.yaml` — **also holds an `overrides:` block**; pnpm reads
  overrides from here as well as from `package.json`. When adding or
  restoring an override, check both files, and keep them in sync
- `.github/workflows/pr-checks.yml` — the exact check suite CI runs
  (astro check, tscheck:node, tscheck:renderer, test, lint, prettier)
- `.github/PULL_REQUEST_TEMPLATE.md` — PR body template
- `AGENTS.md` (root) — commit/PR rules, hook policy
- `.opencode/skills/awesomeb-docs-check/SKILL.md` — reference for what does
  NOT need docs (cited under Hard Rules)
- `git log --oneline | grep 'chore(release)'` — historical release commits
  for format reference
