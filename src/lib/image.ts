export function withCdnWidth(url: string | null | undefined, width: number = 420): string | undefined {
  if (!url) return undefined;
  try {
    // Only apply to http(s) URLs
    if (!/^https?:\/\//i.test(url)) return url;
    // Skip Supabase direct URLs
    if (url.includes('supabase.co')) return url;
    // Skip if width param already present
    if (/([?&])width=\d+/i.test(url)) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}`;
  } catch {
    return url;
  }
}

export function withDefaultCdnWidth(url: string | null | undefined): string | undefined {
  return withCdnWidth(url, 420);
}

