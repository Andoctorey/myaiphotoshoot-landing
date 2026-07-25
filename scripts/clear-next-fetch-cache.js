const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.join(__dirname, '..');

function clearNextFetchCache(projectRoot = PROJECT_ROOT) {
  const fetchCachePath = path.join(projectRoot, '.next', 'cache', 'fetch-cache');
  const existed = fs.existsSync(fetchCachePath);
  fs.rmSync(fetchCachePath, { recursive: true, force: true });
  return { existed, fetchCachePath };
}

if (require.main === module) {
  const result = clearNextFetchCache();
  console.log(result.existed
    ? `Cleared restored Next.js fetch cache: ${result.fetchCachePath}`
    : `No restored Next.js fetch cache found at ${result.fetchCachePath}`);
}

module.exports = {
  clearNextFetchCache,
};
