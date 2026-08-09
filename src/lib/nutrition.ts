/**
 * Fuel Planner — pure rules engine (nutrition-plan-spec §3).
 *
 * `calculatePlan` is a deterministic pure function: same input, same output.
 * No I/O, no Vue imports, no hard-coded brand — rules and products are data
 * (BrandRules + Product[] from src/data/nutrition.ts). Unit-testable and
 * shareable verbatim between the client (Astro island) and a server route.
 */

import type {
  Brand,
  FormatPreference,
  Intensity,
  Product,
  ProductFormat,
} from '../data/nutrition';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw API input (spec §5.2) — all fields optional except durationMinutes/intensity. */
export interface PlanInput {
  brand?: string;
  durationMinutes: number;
  intensity: Intensity;
  bodyWeightKg?: number;
  temperatureC?: number | null;
  caffeine?: boolean;
  formatPreference?: FormatPreference;
  preRacePreload?: boolean;
}

/** Input after defaults are applied (spec §2): weight 70, temp null, etc. */
export interface NormalizedPlanInput {
  brand: string;
  durationMinutes: number;
  intensity: Intensity;
  bodyWeightKg: number;
  temperatureC: number | null;
  caffeine: boolean;
  formatPreference: FormatPreference;
  preRacePreload: boolean;
}

export interface PlanItem {
  productId: string;
  name: string;
  format: ProductFormat;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  carbsG: number;
  caffeineMg: number | null;
  servingSize: string;
}

export interface ScheduleEntry {
  offsetMin: number;
  label: string;
  action: string;
  productId: string;
}

export interface PreRacePreload {
  productId: string;
  quantity: number;
  timing: string;
  price: number;
}

export interface PlanTarget {
  hours: number;
  carbsPerHour: number;
  weightFactor: number;
  totalCarbsTargetG: number;
  /** The cap value that was applied (shortSessionCapG), or null. */
  cappedG: number | null;
}

export interface PlanTotals {
  carbsDeliveredG: number;
  targetG: number;
  itemCount: number;
  units: number;
  price: number;
}

export interface Plan {
  meta: {
    brand: string;
    currency: string;
    ruleVersion: number;
    catalogVersion: string;
    generatedAt: string;
  };
  inputs: NormalizedPlanInput;
  target: PlanTarget;
  items: PlanItem[];
  totals: PlanTotals;
  schedule: ScheduleEntry[];
  preRacePreload: PreRacePreload | null;
  assumptions: string[];
  notes: string[];
}

// ---------------------------------------------------------------------------
// Small numeric helpers (display rounding; engine computes at full precision)
// ---------------------------------------------------------------------------

const round = (x: number, dp: number): number => {
  const f = 10 ** dp;
  return Math.round((x + Number.EPSILON) * f) / f;
};
const round1 = (x: number): number => round(x, 1);
const round2 = (x: number): number => round(x, 2);
const round3 = (x: number): number => round(x, 3);
const clamp = (x: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, x));

// ---------------------------------------------------------------------------
// Defaults (spec §2)
// ---------------------------------------------------------------------------

export const INPUT_DEFAULTS = {
  bodyWeightKg: 70,
  temperatureC: null,
  caffeine: false,
  formatPreference: 'auto' as FormatPreference,
  preRacePreload: true,
};

export function normalizeInput(input: PlanInput): NormalizedPlanInput {
  return {
    brand: input.brand ?? 'maurten',
    durationMinutes: input.durationMinutes,
    intensity: input.intensity,
    bodyWeightKg: input.bodyWeightKg ?? INPUT_DEFAULTS.bodyWeightKg,
    temperatureC: input.temperatureC ?? INPUT_DEFAULTS.temperatureC,
    caffeine: input.caffeine ?? INPUT_DEFAULTS.caffeine,
    formatPreference: input.formatPreference ?? INPUT_DEFAULTS.formatPreference,
    preRacePreload: input.preRacePreload ?? INPUT_DEFAULTS.preRacePreload,
  };
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

interface Pick {
  product: Product;
  qty: number;
}

/**
 * Deterministic ordering for greedy picks: bigger serving first, then cheaper
 * unit price, then stable id order.
 */
const byLargestServing = (a: Product, b: Product): number =>
  b.carbsG - a.carbsG || a.unitPrice - b.unitPrice || a.id.localeCompare(b.id);

const bySmallestServing = (a: Product, b: Product): number =>
  a.carbsG - b.carbsG || a.unitPrice - b.unitPrice || a.id.localeCompare(b.id);

/** Greedy whole-serving fill (spec §3.3). Mutates `picks`. */
function greedyFill(
  picks: Map<string, Pick>,
  candidates: Product[],
  remainingG: number,
  minUnitG: number,
): number {
  let remaining = remainingG;
  while (remaining >= minUnitG) {
    const fits = candidates.filter((c) => c.carbsG <= remaining);
    const pick =
      fits.length > 0
        ? [...fits].sort(byLargestServing)[0]!
        : [...candidates].sort(bySmallestServing)[0]!;
    remaining -= pick.carbsG;
    const cur = picks.get(pick.id);
    picks.set(pick.id, { product: pick, qty: (cur?.qty ?? 0) + 1 });
    // Nothing fits: add the smallest eligible serving, then stop (spec §3.3).
    if (fits.length === 0) break;
  }
  return remaining;
}

/** Build the plan (spec §3). Brand-agnostic: everything tunable lives in `brand.rules`. */
export function calculatePlan(
  input: NormalizedPlanInput,
  brand: Brand,
  products: Product[],
): Plan {
  const rules = brand.rules;
  const catalog = products.filter((p) => p.brandId === brand.id && p.active);
  const generatedAt = new Date().toISOString();

  // --- 3.1 Carb target ----------------------------------------------------
  const hours = round2(input.durationMinutes / 60);
  const rate = rules.carbPerHourByIntensity[input.intensity];
  const rawWeightFactor = input.bodyWeightKg / rules.weightRefKg;
  const weightFactor = clamp(
    rawWeightFactor,
    rules.weightFactorRange[0],
    rules.weightFactorRange[1],
  );
  let target = rate * hours * weightFactor;
  let cappedG: number | null = null;

  if (input.durationMinutes < 45) {
    target = 0;
  } else if (
    input.durationMinutes < rules.shortSessionMin &&
    target > rules.shortSessionCapG
  ) {
    cappedG = rules.shortSessionCapG;
    target = rules.shortSessionCapG;
  }

  // --- 3.2 Format allocation ----------------------------------------------
  const isShort = input.durationMinutes < rules.shortSessionMin;
  let liquidShare: number;
  if (input.formatPreference === 'gels') liquidShare = 0;
  else if (input.formatPreference === 'drink') liquidShare = 1;
  else {
    liquidShare =
      input.temperatureC !== null && input.temperatureC >= rules.heatThresholdC
        ? rules.liquidShareHeat
        : rules.liquidShareDefault;
    if (isShort) liquidShare = 0; // < 90 min: no bottle to carry
  }

  // --- 3.3 Product selection ----------------------------------------------
  const picks: Map<string, Pick> = new Map();
  const drinkCarbsG = rules.drinkCarbsGByIntensity[input.intensity];
  const drinkCandidates = catalog.filter(
    (p) =>
      p.format === 'drink' &&
      p.autoSelect &&
      p.carbsG === drinkCarbsG,
  );
  const gelCandidates = catalog.filter(
    (p) => p.format === 'gel' && p.autoSelect && p.caffeineMg === null,
  );

  const liquidTarget = target * liquidShare;
  let liquidDeliveredG = 0;
  if (liquidShare > 0 && drinkCandidates.length > 0 && target >= rules.minUnitG) {
    greedyFill(picks, drinkCandidates, liquidTarget, rules.minUnitG);
    liquidDeliveredG = sumCarbs(picks);
  }
  const gelTarget = Math.max(0, target - liquidDeliveredG);
  if (gelCandidates.length > 0 && gelTarget >= rules.minUnitG) {
    greedyFill(picks, gelCandidates, gelTarget, rules.minUnitG);
  }

  // --- Caffeine swap (spec §3.2) ------------------------------------------
  const caffeineSwapped = applyCaffeineSwap(picks, catalog, input.caffeine);

  // --- Aggregate into items (drinks first, then gels — pick order) ---------
  const items: PlanItem[] = [...picks.entries()].map(([, p]) => ({
    productId: p.product.id,
    name: p.product.name,
    format: p.product.format,
    quantity: p.qty,
    unitPrice: p.product.unitPrice,
    subtotal: round2(p.qty * p.product.unitPrice),
    carbsG: p.product.carbsG,
    caffeineMg: p.product.caffeineMg,
    servingSize: p.product.servingSize,
  }));

  // --- 3.4 Schedule --------------------------------------------------------
  const schedule = buildSchedule(items, input.durationMinutes);

  // --- Pre-race preload (spec §3.4) ---------------------------------------
  const preload = buildPreload(input, brand, catalog);

  // --- 3.5 Outputs ---------------------------------------------------------
  const totals: PlanTotals = {
    carbsDeliveredG: items.reduce((s, it) => s + it.carbsG * it.quantity, 0),
    targetG: round1(target),
    itemCount: items.length,
    units: items.reduce((s, it) => s + it.quantity, 0),
    price: round2(items.reduce((s, it) => s + it.subtotal, 0)),
  };

  return {
    meta: {
      brand: brand.id,
      currency: rules.currency,
      ruleVersion: brand.ruleVersion,
      catalogVersion: brand.catalogVersion,
      generatedAt,
    },
    inputs: { ...input },
    target: {
      hours,
      carbsPerHour: rate,
      weightFactor: round3(weightFactor),
      totalCarbsTargetG: round1(target),
      cappedG,
    },
    items,
    totals,
    schedule,
    preRacePreload: preload,
    assumptions: buildAssumptions(input, brand, rate, weightFactor, liquidShare, items, caffeineSwapped),
    notes: buildNotes(input, brand, totals.carbsDeliveredG),
  };
}

function sumCarbs(picks: Map<string, Pick>): number {
  let total = 0;
  for (const p of picks.values()) total += p.product.carbsG * p.qty;
  return total;
}

/**
 * Caffeine rule (spec §3.2): last scheduled gel → caffeine gel; if the plan is
 * liquid-only, last drink → caffeine drink mix. Returns whether a swap happened.
 */
function applyCaffeineSwap(
  picks: Map<string, Pick>,
  catalog: Product[],
  caffeine: boolean,
): boolean {
  if (!caffeine || picks.size === 0) return false;

  const gelUnits = [...picks.values()].filter((p) => p.product.format === 'gel');
  const drinkUnits = [...picks.values()].filter((p) => p.product.format === 'drink');

  const caffeineGels = catalog
    .filter((p) => p.format === 'gel' && p.caffeineMg !== null)
    .sort(bySmallestServing);
  const caffeineDrinks = catalog
    .filter((p) => p.format === 'drink' && p.caffeineMg !== null)
    .sort(byLargestServing);

  if (gelUnits.length > 0 && caffeineGels.length > 0) {
    const last = gelUnits[gelUnits.length - 1]!;
    removeOne(picks, last.product.id);
    addOne(picks, caffeineGels[0]!);
    return true;
  }
  if (gelUnits.length === 0 && drinkUnits.length > 0 && caffeineDrinks.length > 0) {
    const last = drinkUnits[drinkUnits.length - 1]!;
    removeOne(picks, last.product.id);
    addOne(picks, caffeineDrinks[0]!);
    return true;
  }
  return false;
}

function addOne(picks: Map<string, Pick>, product: Product): void {
  const cur = picks.get(product.id);
  picks.set(product.id, { product, qty: (cur?.qty ?? 0) + 1 });
}

function removeOne(picks: Map<string, Pick>, productId: string): void {
  const cur = picks.get(productId);
  if (!cur) return;
  if (cur.qty <= 1) picks.delete(productId);
  else cur.qty -= 1;
}

/** Gel offsets: first gel at 30 min, then every 30 (capped at session end). */
function buildSchedule(items: PlanItem[], durationMinutes: number): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  const drinks = items.filter((it) => it.format === 'drink');
  const gels = items.filter((it) => it.format === 'gel');

  if (drinks.length > 0) {
    const units = drinks.reduce((s, it) => s + it.quantity, 0);
    const names = drinks
      .map((it) => `${it.quantity}× ${it.name}`)
      .join(' + ');
    const window =
      units === 1 ? 'the first hour' : `the first ${units} hours`;
    entries.push({
      offsetMin: 0,
      label: 'Start',
      action: `Sip ${names} steadily over ${window}`,
      productId: drinks[0]!.productId,
    });
  }

  // One schedule entry per gel UNIT (a Gel 160 × 3 item yields Gel 1/2/3 slots).
  let gelIndex = 0;
  for (const gel of gels) {
    for (let u = 0; u < gel.quantity; u++) {
      const offset = Math.min(30 * (gelIndex + 1), Math.max(30, durationMinutes - 30));
      const caffeine = gel.caffeineMg !== null ? ' (caffeine)' : '';
      entries.push({
        offsetMin: offset,
        label: `Gel ${gelIndex + 1}`,
        action: `Take 1× ${gel.name} with water${caffeine}`,
        productId: gel.productId,
      });
      gelIndex += 1;
    }
  }

  return entries;
}

function buildPreload(
  input: NormalizedPlanInput,
  brand: Brand,
  catalog: Product[],
): PreRacePreload | null {
  const rule = brand.rules.preRacePreload;
  if (
    !rule ||
    input.intensity !== 'race' ||
    input.durationMinutes < rule.minMinutes ||
    input.preRacePreload === false
  ) {
    return null;
  }
  const product = catalog.find((p) => p.id === rule.productId);
  if (!product) return null;
  return {
    productId: product.id,
    quantity: 1,
    timing: rule.timingLabel,
    price: product.unitPrice,
  };
}

function dominantGelName(items: PlanItem[]): string | null {
  const gels = items.filter((it) => it.format === 'gel');
  if (gels.length === 0) return null;
  return [...gels].sort((a, b) => b.quantity - a.quantity)[0]!.name;
}

function buildAssumptions(
  input: NormalizedPlanInput,
  brand: Brand,
  rate: number,
  weightFactor: number,
  liquidShare: number,
  items: PlanItem[],
  caffeineSwapped: boolean,
): string[] {
  const rules = brand.rules;
  const out: string[] = [];
  out.push(`Carb target ${rate} g/h for ${input.intensity} intensity`);
  out.push(
    `Weight factor ${weightFactor.toFixed(2)} applied (${input.bodyWeightKg} kg vs ${rules.weightRefKg} kg reference)`,
  );

  const heat = input.temperatureC !== null && input.temperatureC >= rules.heatThresholdC;
  if (input.durationMinutes < 45) {
    out.push('Sessions under 45 minutes need no fuel');
  } else if (liquidShare <= 0) {
    const reason = input.durationMinutes < rules.shortSessionMin
      ? 'short session < 90 min'
      : 'format preference: gels';
    out.push(`100% of carbs from gels (${reason})`);
  } else if (liquidShare >= 1) {
    out.push('100% of carbs from liquid (format preference: drink)');
  } else {
    const liquidPct = Math.round(liquidShare * 100);
    const gelPct = 100 - liquidPct;
    const mode = input.formatPreference === 'mixed' ? 'mixed format' : 'auto format';
    const temp = heat ? `, ≥ ${rules.heatThresholdC} °C heat` : `, < ${rules.heatThresholdC} °C`;
    out.push(`${liquidPct}% of carbs from liquid, ${gelPct}% from gels (${mode}${temp})`);
  }

  const gelName = dominantGelName(items);
  if (gelName) {
    const swap = caffeineSwapped
      ? '; last gel swapped for caffeine variant'
      : '';
    out.push(`${gelName} chosen by largest-fitting-unit rule${swap}`);
  } else if (caffeineSwapped) {
    out.push('Last drink swapped for caffeine variant');
  } else if (input.caffeine) {
    out.push('Caffeine requested but no caffeine product in catalog');
  }

  return out;
}

const NOTE_PRACTICE =
  'Practice this exact plan in training — race day is not for experiments';
const NOTE_HYDRATION =
  'Drink water to thirst alongside; plan extra fluid if hot';
const NOTE_HEAT =
  'Plan extra water / electrolyte at aid stations';
const NOTE_MEDICAL = 'Estimates only — not medical advice';

function buildNotes(
  input: NormalizedPlanInput,
  brand: Brand,
  carbsDeliveredG: number,
): string[] {
  if (carbsDeliveredG === 0) {
    return ['No fuel needed for this session', 'Drink water to thirst alongside', NOTE_MEDICAL];
  }
  const heat =
    input.temperatureC !== null &&
    input.temperatureC >= brand.rules.heatThresholdC;
  const notes = [NOTE_PRACTICE, heat ? NOTE_HYDRATION : 'Drink water to thirst alongside'];
  if (heat) notes.push(NOTE_HEAT);
  notes.push(NOTE_MEDICAL);
  return notes;
}
