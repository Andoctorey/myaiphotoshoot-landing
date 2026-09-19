# Cloudflare Pages Deployment

This site is a Next.js static export deployed to Cloudflare Pages.

## Required Pages Settings

- Build command: `npm run build`
- Build output directory: `out`
- Production branch: the branch used for `myaiphotoshoot.com`
- Required env var: `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`

## SEO-Safe Rules

- Keep `https://myaiphotoshoot.com` as the canonical host.
- Redirect `www` and `http` traffic to the canonical host before Google sees page HTML.
- Do not submit preview or `*.pages.dev` URLs to Search Console.
- If preview deployments are public, block them from indexing in Cloudflare with `X-Robots-Tag: noindex, nofollow` or disable the public `pages.dev` route.
- Purge Cloudflare cache after SEO fixes that remove pages, change redirects, or change robots/canonical tags.

## Repo-Managed Safeguards

- `public/_redirects` canonicalizes root English paths and legal/license aliases.
- `public/_redirects` serves `/photo/*` through the statically exported `/photo/` client shell.
- `scripts/generate-image-sitemap.mjs` writes `out/image-sitemap.xml` from the public gallery during each build.
- `scripts/fix-html-lang.js` appends generated localized blog alias redirects into `out/_redirects`.
- `public/_headers` keeps HTML, sitemap, and robots caching short so Search Console sees SEO fixes quickly.
- `src/app/sitemap.ts` must list only canonical, indexable URLs.

## Post-Deploy Checks

Run these after deploy:

```bash
curl -I https://myaiphotoshoot.com/en/
curl -I https://myaiphotoshoot.com/ru/blog/greek-hero-portraits/
curl -I https://myaiphotoshoot.com/photo/4f956904-44cf-406f-9e1a-7b71de36b61a/
curl -fsSL https://myaiphotoshoot.com/sitemap.xml
curl -fsSL https://myaiphotoshoot.com/image-sitemap.xml
```

Expected:

- `/en/` returns `308` to `/`.
- localized English-slug blog aliases return `308` to the localized canonical slug.
- public photo URLs return the static photo shell, whose HTML contains `noindex, follow` metadata.
- sitemap contains canonical localized blog URLs, not localized English-slug aliases.
- image sitemap contains public gallery image URLs and no photo detail URLs.
