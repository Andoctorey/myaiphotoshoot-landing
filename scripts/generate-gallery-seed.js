/*
  Build-time script to generate a static gallery seed for SSR/static HTML.
  Fetches first page of public gallery and writes src/data/gallery-seed.json.
  No secrets required. Safe for Cloudflare Pages static export.
*/

import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const functionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1';
  const url = `${functionsUrl}/public-gallery?page=1&limit=24`;

  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`Failed to fetch gallery seed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected response for gallery seed');
    }

    const outDir = path.join(process.cwd(), 'src', 'data');
    const outFile = path.join(outDir, 'gallery-seed.json');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Wrote ${data.length} items to ${path.relative(process.cwd(), outFile)}`);
  } catch (err) {
    console.warn('[generate-gallery-seed] Non-fatal: falling back to existing seed if present.');
    console.warn(String(err));
  }
}

main();


