# My AI PhotoShoot Landing

Static Next.js/TypeScript marketing site on Cloudflare Pages. UI: `src/app/`, `src/components/`;
i18n: `src/i18n/`; helpers: `src/lib/`; server functions: `functions/`;
deploy proxy: `worker/`; export processing/checks: `scripts/`, `tests/`.

## Working rules

- Edit only requested repositories; read related repos for context. Ask before expanding scope.
- Preserve unrelated edits and staged changes. Stage new files with `git add`; stage or unstage
  existing files only when asked. Keep commits scoped.
- Commits do not authorize pushes or deployments. Report local checks and production status
  separately.
- Supabase is read-only: never mutate data, schema, storage, configuration, or deployed functions
  through commands or APIs. Local code and migration files may be edited.
- Browser, emulator, simulator, and device UI checks require an explicit request. Diagnose UX issues
  with targeted logs and user reproduction.
- Run Gradle build, check, or test commands only when explicitly requested.
- After file changes, include one short commit-message suggestion in the final response.

## Engineering

- Prefer simple, maintainable solutions. Ask before adding substantial complexity for rare failures;
  address material security, privacy, billing, and data-loss risks proportionately.
- Keep files focused; extract distinct, non-trivial responsibilities into named files.
- Verify AI review suggestions against reachable behavior and invariants before applying them.
- Search all usages before changing shared constants, resources, validation, or components. Check
  owning implementations for cross-repository contracts.
- Fix root causes; when evidence is insufficient, add diagnostics and state what evidence is needed.
  Never silence unexplained errors.
- Log unexpected errors at the handling boundary with context and the original cause; trace
  important transitions and external calls. Avoid duplicates, control-flow noise, secrets, personal
  data, and sensitive payloads.
- Comment only non-obvious reasons, invariants, and intentional platform/backend differences at the
  relevant code.

## Landing

- Preserve production static export and trailing slashes; runtime server work belongs in Cloudflare
  functions.
- Use `src/i18n/routing.ts` helpers; English lives at the root. Preserve localized routes,
  canonicals, alternates, metadata, and HTML language attributes.
- Reuse content/API sources and verify pricing, preset, and model contracts before changing offers.
- For route/publication changes, check generation, redirects, navigation, sitemaps, structured data,
  and social metadata. Exclude unpublished content from public exports.
- Keep secrets server-side; validate untrusted content and preserve HTML, JSON-LD, and CSP
  protections.

## Validation

- Test meaningful behavior, important edge cases, and concrete regressions at the smallest reliable
  scope. Avoid implementation-mirroring, framework-behavior, and coverage-only tests.
- Run relevant checks within the restrictions above. Repeat or broaden only for new changes,
  failures, or unresolved concerns; report checks not run.
- Use relevant `test:*` scripts from `package.json` and `npx tsc --noEmit` for TypeScript checks.
- `npm run build` runs suites, fetches content, and processes the export; use it for export changes,
  not documentation edits. Never use submission/deployment scripts as checks.
