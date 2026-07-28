/**
 * The site's two origins.
 *
 * The journal and the workbench are deliberately separate hostnames — the
 * workbench is its own destination, reachable without coming through the
 * journal — so links between them are cross-origin and must be absolute. A
 * root-relative `/` on the workbench would point at the workbench itself.
 *
 * Kept in its own module rather than in `journal.ts` (whose `LINKS` would
 * otherwise be the obvious home) because `journal.ts` imports photos through
 * `astro:assets`, and the Vue island must not pull image imports into the
 * client bundle to read a URL.
 */
export const SITE_ORIGIN = 'https://enzomuhlinghaus.com';
export const WORKBENCH_ORIGIN = 'https://workbench.enzomuhlinghaus.com';
