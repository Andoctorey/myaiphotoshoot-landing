import { canonicalizeLocalizedBlogAliasRequest } from '../../_shared/localized-blog-alias.js';

export async function onRequest(context) {
  return canonicalizeLocalizedBlogAliasRequest(context, 'ar');
}
