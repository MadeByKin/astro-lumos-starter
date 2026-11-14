/** Site name. Appended to every page title and used as `og:site_name`. */
export const SITE_NAME = "Your Studio";
/** Fallback meta description for pages that don't set their own. */
export const SITE_DESCRIPTION =
  "A considered website built with Lumos and Astro.";
/** Canonical origin. Resolves canonical URLs, social images, and the sitemap. */
export const SITE_URL = "https://example.com";
/** BCP 47 document language and default formatting locale. */
export const SITE_LOCALE = "en-GB";
/** Routes excluded from search and the sitemap. Surrounding slashes are ignored. */
export const NOINDEX_ROUTES: string[] = ["/404"];
