// The book's four spreads, in order. This drives the edge tabs, the page-turn
// and the URL hash.
//
// Kept in its own module — deliberately free of image imports — because the
// client-side page-turn script imports it. Pulling it from journal.ts instead
// would drag that module's `astro:assets` imports into the browser bundle and
// make Astro emit the unoptimized originals alongside the generated webp.
export const SPREADS = ['home', 'endurance', 'work', 'travel'] as const;
export type Spread = (typeof SPREADS)[number];
