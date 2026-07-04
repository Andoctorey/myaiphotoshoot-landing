import { canonicalizeLocalizedBlogRequest } from './[locale]/blog/[slug].js';

export async function onRequest(context) {
  return canonicalizeLocalizedBlogRequest(context);
}
