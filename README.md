# codacy-metrics-lizard

This is the docker engine we use at Codacy to have [lizard](https://github.com/terryyin/lizard) support.
You can also create a docker to integrate the tool and language of your choice!
Check the **Docs** section for more information.

## Docs

[Tool Developer Guide](https://support.codacy.com/hc/en-us/articles/207994725-Tool-Developer-Guide)

[Tool Developer Guide - Using Scala](https://support.codacy.com/hc/en-us/articles/207280379-Tool-Developer-Guide-Using-Scala)

## Test

We use the [codacy-plugins-test](https://github.com/codacy/codacy-plugins-test) to test our external tools integration.
You can follow the instructions there to make sure your tool is working as expected.

## Agent Playbook: Updating This Repository End-to-End

This section is written for an AI coding agent (or a human) tasked with updating this repo — most commonly bumping the wrapped [Lizard](https://github.com/terryyin/lizard) version, but also Node/Python base image, CircleCI orb, or npm dependency bumps. Follow it top to bottom.

### 1. What this repository is

This is a Codacy **METRICS** engine, not a pattern-based linting engine (contrast with the sibling repo `codacy-lizard`, which wraps Lizard's rule-based checks). It is a small TypeScript/Node.js application (`src/`, built on the `codacy-seed` npm package) packaged as a Docker image. At runtime it shells out to the [Lizard](https://github.com/terryyin/lizard) Python CLI (installed via `pip install lizard` in the `Dockerfile`) to compute code-complexity metrics (cyclomatic complexity, NLOC, token count, etc.) per method/file, parses Lizard's stdout, and reports the results back to Codacy in the metrics format.

Key source files:
- `src/index.ts` — entrypoint, reads the Codacy input and calls the engine.
- `src/lizardMetricsEngine.ts` — orchestrates a run.
- `src/lizard.ts` — builds and executes the `lizard -V -l <lang> ...` command line (the hard-coded list of `-l` language flags here is what determines which languages get analyzed) and parses its output into `LizardResults`.
- `src/configCreator.ts` — reads `.codacyrc` / tool options into `LizardOptions`.

There is **no `docs/patterns.json`** in this repository, and no `docs/` directory at all — this is expected for a metrics engine, since there are no configurable "patterns" to enumerate. The only local configuration artifact is `.codacyrc` at the repo root, which lists the tool name (`metrics-lizard`) and the compiled JS files the engine ships (`/dist/src/*.js`); it is hand-maintained and only needs updating if source filenames change. There is also no docs generator to run.

Also note: this repo's `.gitignore` excludes `.github`, so `.github/workflows` (mentioned in the "GitHub actions" section below) is not present in a local clone — it's managed by org-wide tooling and is out of scope for this playbook.

### 2. Files that encode versions — check all of these on every update

| File | What it controls | What to check |
|---|---|---|
| `Dockerfile` → `RUN pip install lizard` | The Lizard version bundled | **Not pinned** — installs whatever is latest on PyPI at image-build time. If the task is "bump Lizard to X", there is nothing to edit here to force a specific version unless you deliberately pin it (e.g. `pip install lizard==X`); otherwise a rebuild alone picks up the newest release. Prior bump commits (e.g. `b64fd7b`, titled "bump-lizard-1.22.2") did **not** actually add a pin — they only bumped surrounding infra (see below) and relied on the unpinned install. Confirm with the task requester whether an explicit pin is wanted. |
| `Dockerfile` → `FROM node:lts-alpine3.23 as builder` | Node build-stage base image | Bump the Alpine/Node tag when updating the toolchain. |
| `Dockerfile` → `FROM python:3.14-alpine3.23` | Python runtime base image (where Lizard actually runs) | Keep the Alpine version in this stage and the builder stage consistent. |
| `package.json` → `dependencies.codacy-seed` | Codacy's shared TS engine seed library | Bump per task; check `package-lock.json` regenerates cleanly. |
| `package.json` → `devDependencies` (`typescript`, `eslint`, `@types/node`, etc.) | Build/lint toolchain | Bump together, then run `npm run lint` and `npm run build` to confirm compatibility. `tsconfig.json` may need adjusting too (a past bump added `"types": ["node"]` alongside a `@types/node` bump). |
| `package-lock.json` | Locked dependency graph | Regenerate via `npm install` whenever `package.json` changes; do not hand-edit. |
| `.circleci/config.yml` → `codacy/base` orb | Shared CircleCI steps | Check the latest published version. |
| `.circleci/config.yml` → `codacy/plugins-test` orb | Runs `codacy-plugins-test` in CI (metrics mode) | Same as above. |

### 3. Step-by-step update procedure

1. **Bump the version(s)** as scoped by the task (see table above — for a Lizard bump, decide whether an explicit pin should be added to the `pip install lizard` line, since none currently exists).
2. **Install dependencies and build**: `npm install` (regenerates `package-lock.json` if `package.json` changed), then `npm run build` (runs `tsc --showConfig && tsc`) to confirm the TypeScript compiles.
3. **Lint**: `npm run lint` (`eslint --fix --ext .ts ./src`).
4. **Build the Docker image**: `npm run build:docker` (or `npm run build:docker:m1` on Apple Silicon), which runs the multi-stage `Dockerfile` build (Node build stage, then Python runtime stage with `pip install lizard`).
5. **Run `codacy-plugins-test` locally** before pushing — clone https://github.com/codacy/codacy-plugins-test and run its **metrics** test mode (`run_metrics_tests: true`, matching `.circleci/config.yml`) against your local image tag; pattern and JSON test modes are disabled for this engine (`run_json_tests: false`, `run_pattern_tests: false`).
6. **Iterate on failures**, re-running only the relevant command after each fix.
7. **Commit** the version bump(s) in one change. There are no generated docs files to regenerate/commit alongside it (no `docs/` directory exists).
8. **Push and open a PR.**
9. **Poll the PR's real CI checks until they all pass — local validation is NOT the finish line.** After every push, run `gh pr checks <pr-url>` and keep re-polling (short sleep while any check is `pending`) until all checks finish. If a check fails, fetch its actual log (don't guess), find the true root cause, fix it, push again (never `--no-verify`, never force-push), and re-poll. Repeat until every check is green. **The CI environment's toolchain can differ from your local one**, so a clean local run does not guarantee CI passes. Only stop iterating when every check passes, or you hit a genuine product/infra decision that needs a human.

### 4. Common failure modes and fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm install` changes far more of `package-lock.json` than expected | A devDependency bump pulled in a major version jump transitively (this happened in the `bump-lizard-1.22.2` commit, which rewrote ~7,700 lines of the lockfile) | This is expected/benign for a lockfile regeneration; review `npm run build`/`npm run lint` output rather than the lockfile diff itself to judge success. |
| Docker build fails installing Lizard or Node deps on the Python stage | Alpine version mismatch between the two `FROM` stages, or a Lizard/Python incompatibility | Keep both stages' Alpine tags in sync; check Lizard's supported Python versions before bumping the Python base image. |
| `codacy-plugins-test` metrics run reports missing/changed metrics for a language | The hard-coded `-l <language>` flags in `src/lizard.ts` don't match what the new Lizard version supports, or Lizard changed its output format for a language | Diff Lizard's release notes for language/CLI-flag changes and update `src/lizard.ts`'s language list and/or `parseLizardResults` accordingly. |

### 5. Definition of done

- Version bump(s) reflected in all files that encode them (see table in section 2), with an explicit decision made about whether to pin the Lizard version in the `Dockerfile`.
- `npm install`, `npm run build`, and `npm run lint` all pass locally.
- Docker image builds successfully (`npm run build:docker`).
- `codacy-plugins-test` metrics-mode commands pass locally against the freshly built image.
- **After pushing and opening/updating the PR, every CI check on it is green.** Poll `gh pr checks <pr-url>` and iterate on any failure until all pass.

## What is Codacy

[Codacy](https://www.codacy.com/) is an Automated Code Review Tool that monitors your technical debt, helps you improve your code quality, teaches best practices to your developers, and helps you save time in Code Reviews.

### Among Codacy’s features

-   Identify new Static Analysis issues
-   Commit and Pull Request Analysis with GitHub, BitBucket/Stash, GitLab (and also direct git repositories)
-   Auto-comments on Commits and Pull Requests
-   Integrations with Slack, HipChat, Jira, YouTrack
-   Track issues in Code Style, Security, Error Proneness, Performance, Unused Code and other categories

Codacy also helps keep track of Code Coverage, Code Duplication, and Code Complexity.

Codacy supports PHP, Python, Ruby, Java, JavaScript, and Scala, among others.

### Free for Open Source

Codacy is free for Open Source projects.

## GitHub actions

This repository has the common GitHub actions that we want to have accross all of our public repositories.
They should be kept at `.github/workflows`
