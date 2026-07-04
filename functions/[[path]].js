import { canonicalizeLocalizedBlogAliasRequest } from './_shared/localized-blog-alias.js';

export async function onRequest(context) {
  // Keep localized blog aliases on the root catch-all; nested locale functions can lose to static 404s on Pages.
  return canonicalizeLocalizedBlogAliasRequest(context);
}
