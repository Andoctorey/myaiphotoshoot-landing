# Deployment Proxy

The deployment proxy is exposed at:

```text
https://admin.myaiphotoshoot.com/api/deploy
```

The route must be covered by the existing Cloudflare Access application for
`admin.myaiphotoshoot.com`. The Worker independently verifies the Access JWT
before triggering Cloudflare Pages or GitHub Actions. The public `workers.dev`
endpoint is disabled.

## Cloudflare Setup

1. In **Zero Trust > Access controls > Applications**, open the application
   protecting `admin.myaiphotoshoot.com`.
2. Confirm its policy permits only the administrators who may trigger deploys.
3. Copy the **Application Audience (AUD) Tag** from the application settings.
4. Note the Access team domain, such as `team.cloudflareaccess.com`.
5. From the `worker` directory, configure the Worker:

```bash
npx wrangler secret put DEPLOY_WEBHOOK_URL
npx wrangler secret put TEAM_DOMAIN
npx wrangler secret put POLICY_AUD
npx wrangler secret put DEPLOY_ALLOWED_EMAILS
```

`DEPLOY_ALLOWED_EMAILS` is a comma-separated defense-in-depth allowlist.

Optionally configure GitHub workflow dispatch:

```bash
npx wrangler secret put GITHUB_ACTIONS_TRIGGER_TOKEN
```

## Deployment Order

1. From the landing repository root, deploy the Worker:

```bash
./worker/deploy-worker.sh
```

2. Build and deploy `myaiphotoshoot-admin`. Its deployment calls use the
   same-origin `/api/deploy` route and require no public deploy URL.

## Verification

From the landing repository root, run local checks:

```bash
npm run test:worker
npx wrangler deploy --dry-run --config worker/wrangler.toml
```

After deployment:

1. An unauthenticated request must be blocked by Cloudflare Access.
2. An authenticated but non-allowlisted email must receive `403`.
3. Publishing from the admin must start one Pages deploy.
4. If configured, the GitHub search-update workflow must also start.
