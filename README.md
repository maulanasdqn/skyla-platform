# Skyla Platform

**Everything around [Skyla Kernel](https://github.com/maulanasdqn/skyla-kernel): the chat web app, the user dashboard, the admin backoffice, the iOS and Android apps, the API that ties them together, and the Rust inference service that runs the kernels.**

The TypeScript side is built on a moon + pnpm monorepo: Hono + oRPC + Effect, Drizzle, better-auth, React 19 + TanStack + Vite + Tailwind v4, Biome, Vitest, Playwright. The Rust side is a Cargo workspace under `crates/` that depends on skyla-kernel by path, so check both out side by side:

```sh
git clone https://github.com/maulanasdqn/skyla-kernel.git
git clone https://github.com/maulanasdqn/skyla-platform.git
```

## Architecture

```text
 browser: /app (chat)   /dashboard (user)   /admin (backoffice)        iOS / Android
            \                 |                   /                       |
             \________ same origin, session cookie ______        bearer token
                                 |                                        |
                          apps/api  (Hono + oRPC + better-auth) <---------+
                                 |  /api/chat/* : auth, chat:use permission, rate limit
                                 v
                    crates/skyla-server  (`skyla serve`, /v1, service token)
                                 |
                    skyla-kernel engine on the GPU (Metal or Vulkan)
```

The browser and the mobile apps never talk to the inference service: the API checks the session and the `chat:use` permission, then streams the service's NDJSON back as server-sent events. The iOS app can also run the engine on the phone itself through `skyla-ffi`.

## Layout

```
apps/
  web/          chat web app, served under /app (also hosts sign-in and sign-up)
  dashboard/    user dashboard under /dashboard: overview, usage, API keys, account
  admin/        admin backoffice under /admin: users, roles, permissions, activity, subscribers, notes
  api/          Hono + oRPC + Drizzle + Effect, organised by module; serves the three SPAs in production
  api-e2e/      API integration tests
  web-e2e/      Playwright E2E against the three SPAs served by the API
  landing/      Astro landing page, served at / when LANDING_DIST_PATH is set
  ios/          SwiftUI app (XcodeGen): on-device engine through skyla-ffi, or the cloud API
  android/      Kotlin + Jetpack Compose app: the cloud API (on-device engine planned)
crates/
  skyla-server  internal inference service behind the API (`skyla serve`)
  skyla-cli     the `skyla` binary: serve, chat, run, ref, bench, wsp
  skyla-chat    chat sessions: templates, sampling, streaming
  skyla-tok     BPE tokenizer read from GGUF metadata
  skyla-types   wire types of the inference service
  skyla-ffi     C interface for the iOS app
tools/
  skyla-image   macOS Stable Diffusion helper the inference service runs for image generation
packages/
  shell/        what the three SPAs share: session and auth helpers, oRPC client, sidebar, tables, forms, Vite config
  contract/     oRPC contract and the base paths of the three SPAs
  schemas/      Zod schemas shared by api + web
  components/   shadcn/ui primitives + guards + theme
  permissions/  permission catalog + role maps
  messages/     user-facing message constants
  activity, queue, cache, mail, storage, grpc, logger, metrics, tracing, format, migrations, version
```

## Getting Started

Requires [moon](https://moonrepo.dev/docs/install) + [proto](https://moonrepo.dev/proto), or Node 24 / pnpm 11 directly, plus Rust and `glslc` for the inference service (see the skyla-kernel README; set `GLSLC` when it is not on `PATH`).

Requires [moon](https://moonrepo.dev/docs/install) + [proto](https://moonrepo.dev/proto), or Node 24 / pnpm 11 directly. `.prototools` pins every tool, proto included, and `make install` stops with the version to upgrade to when proto is older than the pin.

```sh
make install                          # checks proto, then pnpm install
cp apps/api/.env.example apps/api/.env # and apps/web/.env.example to apps/web/.env
make setup                            # docker services, migrate and seed
make inference MODEL=../skyla-kernel/models/qwen3-0.6b-q8_0.gguf  # Rust inference service on :8080
make up                               # start api + web, dashboard and admin together
```

Dependency versions that more than one package shares (TypeScript, Vitest, React, zod, `ts-pattern`, `ts-belt` and the rest) are pinned once in the `catalog` of `pnpm-workspace.yaml`, and a manifest refers to them as `catalog:`; bump the version there and every package moves together. The example files already match what `docker-compose.dev.yml` brings up, so they work unedited for local development. In development the web app reaches the API through Vite's same-origin proxy rather than `VITE_API_URL`, so the session cookie stays first-party even when the API is on another localhost host or port. `apps/api/.env.example` is the full list of variables the API accepts, and `envSchema` rejects a missing or malformed one at boot rather than failing later in a request.

Or run them separately:

```sh
make api                              # api on :3001
make web                              # chat web app on :5173/app/
make dashboard                        # user dashboard on :5174/dashboard/
make admin                            # admin backoffice on :5175/admin/
make landing                          # landing on :4321, with /app proxied to the web and /api to the api
```

Seed logins: `admin@test.app` / `Password123`, `member@test.app` / `Password123`, `viewer@test.app` / `Password123`. That password is the default outside production only. With `NODE_ENV=production` the seed refuses to run unless `SEED_PASSWORD` is set, and then it creates the admin alone, with that password and no demo users or notes.

Mail sent in development is caught by mailpit, read it at `http://localhost:8025`.

Anyone can create an account at `/app/register` while `SIGN_UP_ENABLED` in `@app/schemas` is `true`. An app where only an admin adds people sets it to `false`, which makes the API refuse sign-up, redirects `/app/register` to `/app/login` and hides the sign-up link. A new account has to confirm its email address before it can sign in, so in development open the confirmation link from mailpit. Forgotten passwords are reset from `/app/forgot-password` the same way. Passwords need at least 8 characters with an uppercase letter, a lowercase letter and a number. Seeded users and users an admin creates start out confirmed. Admins can also invite someone by email, who then chooses their own password, deactivate a user (which signs them out everywhere and blocks sign-in without deleting anything), see and revoke a user's sessions, and change a user's email, which the user then has to confirm. Anyone can turn on two-factor authentication from the Account page with an authenticator app; signing in then asks for a 6-digit code or one of ten single-use backup codes, and a device can be trusted for 30 days. An admin can turn it off for a user who has lost both their device and their codes. Nobody can give a role or a permission they do not hold themselves, act on a user whose role they could not give, or edit the role they hold, and only a superadmin can make or manage another superadmin.

The landing page and every blog page carry a newsletter sign-up form. A sign-up is kept in its own `newsletter_subscriber` table rather than as a user, because a reader is not an account, and it starts as `pending`; signing up twice answers the same way and stores the address once. Admins see and remove sign-ups on `/app/subscribers` (`newsletter:read`, `newsletter:delete`), and the sign-up endpoint shares the API's rate limit window with its own budget. Nothing is mailed yet: there is no confirmation email and no sending step.

Uploaded images go to the local object store, whose console is at `http://localhost:9101/rustfs/console/` with the same credentials as the api.

The API reaches the inference service at `INFERENCE_URL` (default `http://127.0.0.1:8080`) and sends `INFERENCE_TOKEN` as a bearer token when it is set; start `skyla serve` with the same token outside local development. In development each SPA runs on its own Vite port and proxies `/api`, `/rpc` and the other two SPAs, so links between them work from any of the three ports. In production the API serves them from `WEB_DIST_PATH`, `DASHBOARD_DIST_PATH` and `ADMIN_DIST_PATH`.

## Get models

Any GGUF of the `qwen3`, `qwen3moe` or `qwen35` architecture with Q8_0, Q4_K or Q6_K weights works
(abliterated variants included, e.g. Huihui-Qwen3-30B-A3B-Instruct-2507-abliterated). Keep one
folder per model under a common directory so the browser UI can list them:

```powershell
mkdir models\r1-8b, models\qwen3-4b
curl -L -o models\r1-8b\r1-8b.gguf https://huggingface.co/mradermacher/Josiefied-DeepSeek-R1-0528-Qwen3-8B-abliterated-v1-GGUF/resolve/main/Josiefied-DeepSeek-R1-0528-Qwen3-8B-abliterated-v1.Q4_K_M.gguf
curl -L -o models\qwen3-4b\qwen3-4b.gguf https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf
```

The chat template is detected from the GGUF: DeepSeek-R1 (`<｜User｜>…<｜Assistant｜>`) or
ChatML (`<|im_start|>…<|im_end|>`, Qwen3 Instruct).

## Mobile apps

| App | Build | Notes |
|---|---|---|
| iOS (`apps/ios`) | `make ios` (simulator), or `xcodegen generate` and Xcode for a device | Set `DEVELOPMENT_TEAM` in `project.yml`. The Xcode build compiles `skyla-ffi` for the device or the simulator itself. On device mode runs the engine on the iPhone GPU; Cloud mode signs in to the API |
| Android (`apps/android`) | `make android`, then `adb install app/build/outputs/apk/debug/app-debug.apk` | Needs the Android SDK and a JDK 17+. Defaults to `http://10.0.2.2:3001`, the host machine from the emulator |

Both sign in with `POST /api/auth/sign-in/email`, keep the session token from the `set-auth-token` header and send it as `Authorization: Bearer`, list models with `GET /api/chat/models` and stream replies from `POST /api/chat/stream` as server-sent events.

## The `skyla` command line

| Command | What it does |
|---|---|
| `skyla serve <model>` | Internal inference service on `--addr` (default `127.0.0.1:8080`) under `/v1`; `--models <dir>` sets the folder it can switch between, `--token` (or `SKYLA_SERVICE_TOKEN`) requires a bearer token |
| `skyla chat <model>` | Terminal chat with the model's own template (DeepSeek-R1 or ChatML) |
| `skyla run <model> --tokens <ids>` | Greedy decode from token ids; `--check` compares every step with the CPU reference, `--profile` times every GPU stage |
| `skyla ref <model> --tokens <ids>` | Greedy decode with the CPU reference; `--expect <ids>` teacher-forces another engine's output |
| `skyla tokenize <model> <text>` | Token ids from the model's tokenizer |
| `skyla gguf-info <model>` | Metadata and tensor summary |
| `skyla probe` | Vulkan device, features, limits and memory types |
| `skyla bench-bw` | Read bandwidth of every GPU memory type and of the CPU |

`chat` options:

| Option | Default | |
|---|---|---|
| `--ctx` | 16384 | Context length (KV cache size) |
| `--kv` | `v8` | KV cache precision: `f16`, `v8` (f16 keys, int8 values) or `q8` |
| `--max-tokens` | 4096 | Tokens per reply, thinking included |
| `--temp` / `--top-k` / `--top-p` | 0.6 / 40 / 0.95 | DeepSeek's recommended R1 sampling; `--temp 0` is greedy |
| `--seed` | time | Sampling seed |
| `--system` | none | System prompt |

Environment: `SKYLA_VALIDATION=1` enables the Khronos validation layer, `SKYLA_DEVICE=<n>`
selects a device other than the first integrated GPU. On macOS the Vulkan loader is found
in `/opt/homebrew/lib`, `/usr/local/lib` or `$VULKAN_SDK/lib`; Homebrew's validation layer
also needs `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib`.

## Version and Health

The root `package.json` version is the single source of truth for the workspace. `@app/version` re-exports it as `APP_VERSION` (a plain JSON import, no build step and no generated file), and both sides serve it:

| Surface | Response |
|---|---|
| `health.check` over RPC, `GET /api/health` | `{ status: "ok", version }` |
| `GET /healthz` | `{ status, version }`, liveness only: the process answers, nothing is probed |
| `GET /ready` | `{ status, version, dependencies }`, and **503** when any dependency is down |
| `/app/health` on the web (no auth) | its own version next to the API's |
| `GET /metrics` | Prometheus text: request counts and durations by method, matched route and status, plus process figures. Guarded by `METRICS_TOKEN`, and required to be in production. See [docs/operations/metrics.md](docs/operations/metrics.md) |

The shape is `healthSchema` in `@app/schemas`, so the web page is typed against what the API returns; the two versions differing means web and API are deployed out of step.

**Every change bumps the root version** in the same commit, so `/health` always names the build you are looking at: patch for a fix, chore or docs change, minor for a feature, major for a breaking change. Only the root version matters; the workspace packages are private and unpublished.

## Commands

Every command goes through `make` or `moon`; nothing shells into a package directory.

```sh
make help                             # every target, with a one-line description
make setup                            # services + migrate + seed
make services | services-stop         # docker: postgres, redis, rabbitmq, mailpit, object store
make api | web | dashboard | admin | landing | worker  # run one process
make inference MODEL=<path.gguf>      # the Rust inference service
make ios | android                    # build a mobile app
make db-migrate | db-seed | db-studio # database
make check | lint | test | build      # quality gates
make e2e                              # api + web end-to-end
make ci                               # everything CI runs, on affected projects
```

```sh
moon run :check                       # biome check (format + lint)
moon run :build                       # tsc --noEmit, every project
moon run :test                        # unit tests
moon run web:test -- --coverage.reportsDirectory=coverage/second  # a run beside another one, with its own coverage folder
moon run api:db-generate              # generate drizzle migration
moon run landing:new-post -- "<title>" # start a blog article and print its writing prompt
moon ci                               # what CI runs
```

## Releasing

Trunk-based development on `trunk`. Branches are short-lived, branch off `trunk`, and squash-merge once CI is green. Pre-push hooks run biome and the typecheck plus unit tests via lefthook. Dependabot keeps deps current.

`trunk` is protected and the rules apply to admins too:

| Rule | Effect |
|---|---|
| Pull request required | No direct pushes to `trunk`; 0 approvals required, so you can merge your own once CI is green |
| 3 required checks, strict | `Check, test, build (affected)`, `E2E (api + web)` and `Drizzle schema drift check` must pass, and the branch must be up to date with `trunk` |
| Linear history, squash-only | Merge commits and rebase merges are disabled at the repo level |
| Branch auto-deleted on merge | Keeps the branch list honest about what is in flight |
| No force pushes or deletions | Applies to everyone, including admins |

`E2E (api + web)` is a gate rather than a suite: the API and the web suites run as two parallel jobs and the gate reports their combined result, so the required check keeps one name. Both suites are skipped when a change touches only Markdown, documentation and the root version, which is why a documentation pull request goes green in seconds.

A branch that has fallen behind must be rebased on `trunk` and re-pushed; that is what keeps the history linear and every commit on `trunk` CI-green.

PRs use `.github/PULL_REQUEST_TEMPLATE.md`. Fill every section in place, writing "None" rather than deleting one. Reviews use `.github/PULL_REQUEST_REVIEW_TEMPLATE.md` and always cover three sections: **Functional** (correctness, and whether every Changelog bullet is actually implemented), **Clean Code** (the conventions in `.claude/skills/ts-conventions/SKILL.md`, plus duplication and naming), and **Feature Suggestions** (non-blocking, each tagged `this-pr` or `follow-up`). Findings in the first two carry a P0–P3 severity from the template's legend.

Releases are automatic and there is nothing to run by hand: every merge to `trunk` carries a version bump, and the workflow tags that commit once its checks are green. The notes are lifted from each PR's Changelog section rather than from commit subjects, which is why that section is written for whoever reads the release page. How it is assembled, and how to re-run a publish that failed, are in [docs/operations/deployment.md](docs/operations/deployment.md).

## Documentation

| Document | Answers |
|---|---|
| [AGENTS.md](AGENTS.md) | The rules an agent or a new contributor works under, and which file to read before what |
| [.claude/skills/ts-conventions/SKILL.md](.claude/skills/ts-conventions/SKILL.md) | The TypeScript ruleset, in full |
| [docs/adding-a-module.md](docs/adding-a-module.md) | Every touchpoint a new module, endpoint or permission has to reach |
| [docs/effect-services.md](docs/effect-services.md) | Why a service is a const and an error is a class |
| [docs/blog.md](docs/blog.md) | Where articles live, how `new-post` starts one, and what the content checks enforce |
| [docs/operations/](docs/operations/) | Deploying, backups, runbooks, alerting, credentials, retention, logging |
| [docs/kpi/](docs/kpi/) | Where this repository stands against an external engineering standards rubric |
