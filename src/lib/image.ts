export function withCdnWidth(url: string | null | undefined, width: number = 420): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
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

const BLOG_IMAGE_WIDTHS = [420, 768, 1024] as const;
const BLOG_IMAGE_SIZES = '(max-width: 480px) calc(50vw - 24px), (max-width: 767px) calc(50vw - 32px), 420px';
const RESPONSIVE_IMAGE_CDN_HOSTS = new Set([
  'cdn.myaiphotoshoot.com',
  'myaiphotoshoot.b-cdn.net',
  'system-images.b-cdn.net',
]);

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function removeQuotedAttribute(attributes: string, name: string): string {
  const pattern = new RegExp(`\\s*\\b${name}\\s*=\\s*(["'])[^"']*\\1`, 'gi');
  return attributes.replace(pattern, ' ');
}

export function addResponsiveCdnAttributesToBlogImages(html: string): string {
  if (!html) return html;

  return html.replace(
    /<img\s+([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>/gi,
    (match, preAttributes: string, src: string, postAttributes: string) => {
      try {
        const sourceUrl = new URL(src.replaceAll('&amp;', '&'));
        if (!RESPONSIVE_IMAGE_CDN_HOSTS.has(sourceUrl.hostname)) {
          return match;
        }

        sourceUrl.searchParams.delete('width');
        const originalUrl = sourceUrl.toString();
        const srcSet = BLOG_IMAGE_WIDTHS.map((width) => {
          const variantUrl = new URL(originalUrl);
          variantUrl.searchParams.set('width', String(width));
          return `${escapeHtmlAttribute(variantUrl.toString())} ${width}w`;
        }).join(', ');

        const selfClosing = /\/\s*$/.test(postAttributes);
        const postAttributesWithoutSlash = postAttributes.replace(/\/\s*$/, '');
        const combinedAttributes = `${preAttributes} ${postAttributesWithoutSlash}`;
        const cleanAttributes = removeQuotedAttribute(
          removeQuotedAttribute(combinedAttributes, 'srcset'),
          'sizes',
        ).trim();
        const otherAttributes = cleanAttributes ? ` ${cleanAttributes}` : '';

        return [
          '<img',
          otherAttributes,
          ` srcset="${srcSet}"`,
          ` sizes="${BLOG_IMAGE_SIZES}"`,
          ` src="${escapeHtmlAttribute(originalUrl)}"`,
          selfClosing ? ' /' : '',
          '>',
        ].join('');
      } catch {
        return match;
      }
    },
  );
}
