// The four Toolbox tools: routes and card dot colors. Names/descriptions
// live in the i18n dictionaries under `tools.<key>`.
export type ToolKey = 'pace' | 'mas' | 'predictor' | 'namer';

export const TOOLS: { key: ToolKey; href: string; dot: string }[] = [
  { key: 'pace', href: '/toolbox/pace-calculator/', dot: 'var(--accent)' },
  { key: 'mas', href: '/toolbox/mas-vo2max/', dot: '#4a6a52' },
  { key: 'predictor', href: '/toolbox/race-predictor/', dot: '#5d7a8c' },
  { key: 'namer', href: '/toolbox/strava-namer/', dot: '#a2843c' },
];
