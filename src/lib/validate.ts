/**
 * Fuel Planner — request validation (spec §5.4).
 *
 * Collects ALL field errors (not fail-fast) and returns the spec's error shape:
 *   { error: { code, message, fields: [{ field, code, detail?, min?, max? }] } }
 *
 * Ported from the nutrition-plan-service (task t_f6579854) — identical logic,
 * only the import specifiers were adjusted for this repo's module resolution.
 */

import { DEFAULT_BRAND_ID, getBrand, getProducts } from '../data/nutrition';
import type { Brand, Product } from '../data/nutrition';
import { normalizeInput } from './nutrition';
import type { NormalizedPlanInput, PlanInput } from './nutrition';

export const INTENSITIES = ['easy', 'moderate', 'hard', 'race'] as const;
export const FORMAT_PREFERENCES = ['auto', 'gels', 'drink', 'mixed'] as const;

export interface FieldError {
  field: string;
  code: string;
  /** Human-readable detail; range violations also carry min/max. */
  detail?: string;
  min?: number;
  max?: number;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: FieldError[];
}

export interface ValidatedRequest {
  input: NormalizedPlanInput;
  brand: Brand;
  products: Product[];
}

export type ValidationResult =
  | { ok: true; value: ValidatedRequest }
  | { ok: false; error: ApiError };

/** The single enabled brand for MVP — extend here when more brands ship. */
export const BRAND_IDS: string[] = ['maurten'];

function rangeError(field: string, min: number, max: number): FieldError {
  return {
    field,
    code: 'OUT_OF_RANGE',
    detail: `expected ${min}–${max}`,
    min,
    max,
  };
}

/**
 * Validate a parsed JSON request body. `raw` must be a plain object.
 * Returns the normalized input + brand + products on success.
 */
export function validatePlanRequest(raw: unknown): ValidationResult {
  const fields: FieldError[] = [];

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: 'Request body must be a JSON object',
        fields: [
          { field: 'body', code: 'INVALID_TYPE', detail: 'expected a JSON object' },
        ],
      },
    };
  }
  const body = raw as Record<string, unknown>;

  // --- brand ----------------------------------------------------------------
  let brandId = DEFAULT_BRAND_ID;
  if (body.brand !== undefined) {
    if (typeof body.brand !== 'string' || body.brand.length === 0) {
      fields.push({ field: 'brand', code: 'INVALID_TYPE', detail: 'expected a string' });
    } else {
      brandId = body.brand;
    }
  }
  const brand = getBrand(brandId);
  if (brandId !== DEFAULT_BRAND_ID && !brand) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_BRAND',
        message: `Unknown brand "${brandId}"; expected one of ${BRAND_IDS.join(', ')}`,
        fields: [
          {
            field: 'brand',
            code: 'UNKNOWN_BRAND',
            detail: `expected one of ${BRAND_IDS.join('|')}`,
          },
        ],
      },
    };
  }
  if (!brand) {
    // brandId === DEFAULT_BRAND_ID but registry missing — cannot happen with the
    // shipped registry; guarded for custom registries.
    return {
      ok: false,
      error: { code: 'INTERNAL', message: 'Default brand not registered' },
    };
  }

  // --- durationMinutes (required, integer 5–720) ----------------------------
  const duration = body.durationMinutes;
  if (duration === undefined) {
    fields.push({ field: 'durationMinutes', code: 'REQUIRED' });
  } else if (typeof duration !== 'number') {
    fields.push({ field: 'durationMinutes', code: 'INVALID_TYPE', detail: 'expected integer' });
  } else if (!Number.isInteger(duration)) {
    fields.push({ field: 'durationMinutes', code: 'INVALID_TYPE', detail: 'expected integer' });
  } else if (duration < 5 || duration > 720) {
    fields.push(rangeError('durationMinutes', 5, 720));
  }

  // --- intensity (required, enum) -------------------------------------------
  const intensity = body.intensity;
  if (intensity === undefined) {
    fields.push({ field: 'intensity', code: 'REQUIRED' });
  } else if (typeof intensity !== 'string' || !(INTENSITIES as readonly string[]).includes(intensity)) {
    fields.push({
      field: 'intensity',
      code: 'INVALID_ENUM',
      detail: 'expected one of easy|moderate|hard|race',
    });
  }

  // --- bodyWeightKg (optional number 30–200) ---------------------------------
  const weight = body.bodyWeightKg;
  if (weight !== undefined && weight !== null) {
    if (typeof weight !== 'number') {
      fields.push({ field: 'bodyWeightKg', code: 'INVALID_TYPE', detail: 'expected number' });
    } else if (weight < 30 || weight > 200) {
      fields.push(rangeError('bodyWeightKg', 30, 200));
    }
  }

  // --- temperatureC (optional number|null, −20–50) ---------------------------
  const temp = body.temperatureC;
  if (temp !== undefined && temp !== null) {
    if (typeof temp !== 'number') {
      fields.push({ field: 'temperatureC', code: 'INVALID_TYPE', detail: 'expected number or null' });
    } else if (temp < -20 || temp > 50) {
      fields.push(rangeError('temperatureC', -20, 50));
    }
  }

  // --- caffeine / preRacePreload (optional booleans) -------------------------
  for (const key of ['caffeine', 'preRacePreload'] as const) {
    const v = body[key];
    if (v !== undefined && typeof v !== 'boolean') {
      fields.push({ field: key, code: 'INVALID_TYPE', detail: 'expected boolean' });
    }
  }

  // --- formatPreference (optional enum) --------------------------------------
  const format = body.formatPreference;
  if (format !== undefined) {
    if (typeof format !== 'string' || !(FORMAT_PREFERENCES as readonly string[]).includes(format)) {
      fields.push({
        field: 'formatPreference',
        code: 'INVALID_ENUM',
        detail: 'expected one of auto|gels|drink|mixed',
      });
    }
  }

  if (fields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: `${fields.length} field(s) failed validation`,
        fields,
      },
    };
  }

  const input = normalizeInput(body as unknown as PlanInput);
  return {
    ok: true,
    value: {
      input,
      brand,
      products: getProducts(brand.id),
    },
  };
}
