const fs = require('fs');
const xml = fs.readFileSync('/Users/andrey/.gemini/antigravity/brain/efd0e2bf-f203-4024-9ac1-cb5ff0f993af/.system_generated/steps/29/content.md', 'utf8');

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractLocUrls(xml) {
  const matches = xml.match(/<loc>([\s\S]*?)<\/loc>/gi) || [];

  return matches
    .map((entry) => entry.replace(/<\/?loc>/gi, '').trim())
    .map(decodeXml)
    .filter((url) => isHttpUrl(url));
}

console.time('extract');
const urls = extractLocUrls(xml);
console.timeEnd('extract');
console.log('URLs:', urls.length);
