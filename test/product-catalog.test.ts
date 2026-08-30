// @vitest-environment happy-dom
/**
 * Fuel Planner — ProductCatalog component tests (UI task t_965bfae3).
 *
 * Acceptance criteria covered here:
 *   - only Maurten products are enabled (brand allowlist gating)
 *   - non-Maurten brands are not selectable (disabled rows, no-op clicks)
 *   - loading / empty / error states render correctly
 *   - no unhandled exceptions in UI event handlers
 *
 * The component is prop-driven (no network) — tests feed it the golden
 * fixtures from test/fixtures/nutrition (products-multibrand.json carries a
 * synthetic `acme` brand precisely so non-Maurten gating is provable).
 */
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductCatalog from '../src/components/tools/ProductCatalog.vue';
import { productsMultibrandFixture } from './fixtures/nutrition';
import { NutritionApiError } from '../src/api/client';
import { BRAND_ALLOWLIST } from '../src/data/nutrition';
import type { Product } from '../src/data/nutrition';

const ALL = productsMultibrandFixture.products;
const maurtenProducts = ALL.filter((p) => p.brandId === 'maurten');
const acmeProducts = ALL.filter((p) => p.brandId === 'acme');

const ready = { status: 'ready' as const, error: null };

function mountCatalog(props: Record<string, unknown> = {}) {
  return mount(ProductCatalog, {
    props: { products: ALL, ...ready, ...props },
    attachTo: document.body,
  });
}

describe('brand allowlist gating', () => {
  it('renders every product from the catalog (allowed and not)', () => {
    const w = mountCatalog();
    const rows = w.findAll('.fp-product');
    expect(rows.length).toBe(ALL.length);
    expect(w.text()).toContain('AVAILABLE PRODUCTS');
  });

  it('only Maurten products are enabled/selectable', () => {
    const w = mountCatalog();
    const enabled = w.findAll('.fp-pick:not(:disabled)');
    const disabled = w.findAll('.fp-pick:disabled');
    expect(enabled.length).toBe(maurtenProducts.length);
    expect(disabled.length).toBe(acmeProducts.length);
  });

  it('Maurten rows carry no "coming soon" tag; non-Maurten rows do', () => {
    const w = mountCatalog();
    expect(w.findAll('.fp-p-tag').length).toBe(acmeProducts.length);
    const maurtenRow = w
      .findAll('.fp-product')
      .find((r) => r.text().includes(maurtenProducts[0].name))!;
    expect(maurtenRow.find('.fp-p-tag').exists()).toBe(false);
  });

  it('is gated by the allowlist prop, not hardcoded names', async () => {
    // A custom allowlist (both brands) flips acme rows to enabled — proves
    // gating is configuration-driven.
    const w = mountCatalog({ allowlist: ['maurten', 'acme'] });
    expect(w.findAll('.fp-pick:not(:disabled)').length).toBe(ALL.length);
    await w.setProps({ allowlist: ['maurten'] });
    expect(w.findAll('.fp-pick:disabled').length).toBe(acmeProducts.length);
  });

  it('default allowlist equals the registry config entry', () => {
    expect(BRAND_ALLOWLIST).toEqual(['maurten']);
  });
});

describe('selection (preserved where valid)', () => {
  it('toggling a Maurten product emits update:selected and marks it picked', async () => {
    const w = mountCatalog();
    const target = maurtenProducts[0];
    const row = w.findAll('.fp-product').find((r) => r.text().includes(target.name))!;
    await row.find('.fp-pick').trigger('click');
    expect(w.emitted('update:selected')).toBeTruthy();
    expect(w.emitted('update:selected')!.at(-1)![0]).toEqual([target.id]);
    expect(row.find('.fp-pick').classes()).toContain('picked');
  });

  it('clicking a disabled non-Maurten product is a no-op (no emit, no throw)', async () => {
    const w = mountCatalog();
    const target = acmeProducts[0];
    const row = w.findAll('.fp-product').find((r) => r.text().includes(target.name))!;
    const pick = row.find('.fp-pick');
    expect(pick.attributes('disabled')).toBeDefined();
    // Clicks on disabled buttons don't dispatch click in real browsers; force
    // it and assert the handler never runs / never throws.
    await expect(pick.trigger('click')).resolves.toBeUndefined();
    expect(w.emitted('update:selected')).toBeUndefined();
  });

  it('starts from the selected prop and prunes ids that become invalid', async () => {
    const w = mountCatalog({
      selected: [maurtenProducts[0].id, 'acme-gel-s', 'ghost-product'],
    });
    // Maurten id kept; acme + ghost pruned at mount (not allowed / missing).
    expect(w.emitted('update:selected')!.at(-1)![0]).toEqual([maurtenProducts[0].id]);
    // Now a reload drops the Maurten product entirely → selection empties.
    const onlyAcme = acmeProducts.map((p) => ({ ...p }));
    await w.setProps({ products: onlyAcme });
    expect(w.emitted('update:selected')!.at(-1)![0]).toEqual([]);
  });

  it('preserves valid selections across a ready → error → ready cycle', async () => {
    const w = mountCatalog({ selected: [maurtenProducts[0].id] });
    // Error state (products list unchanged) — selection survives.
    await w.setProps({
      status: 'error',
      error: new NutritionApiError(0, { code: 'NETWORK', message: 'down' }),
    });
    // Back to ready with the same catalog — still selected.
    await w.setProps({ status: 'ready', error: null });
    const row = w
      .findAll('.fp-product')
      .find((r) => r.text().includes(maurtenProducts[0].name))!;
    expect(row.find('.fp-pick').classes()).toContain('picked');
  });
});

describe('loading / empty / error states', () => {
  it('renders the loading state (idle and loading both show it)', async () => {
    const w = mountCatalog({ products: [], status: 'loading' });
    expect(w.find('[data-state="loading"]').exists()).toBe(true);
    expect(w.text()).toContain('Loading products…');
    await w.setProps({ status: 'idle' });
    expect(w.find('[data-state="loading"]').exists()).toBe(true);
  });

  it('renders the empty state when ready with no products', () => {
    const w = mountCatalog({ products: [], status: 'ready' });
    expect(w.find('[data-state="empty"]').exists()).toBe(true);
    expect(w.text()).toContain('No products available yet');
  });

  it('renders the network-failure error state', () => {
    const w = mountCatalog({
      status: 'error',
      error: new NutritionApiError(0, { code: 'NETWORK', message: "Couldn't reach" }),
    });
    expect(w.find('[data-state="error"]').exists()).toBe(true);
    expect(w.text()).toContain("Couldn't reach the plan service");
    expect(w.text()).toContain("Couldn't load the product list");
  });

  it('renders the backend-error state (server 4xx/5xx)', () => {
    const w = mountCatalog({
      status: 'error',
      error: new NutritionApiError(503, {
        code: 'INTERNAL',
        message: 'boom',
      }),
    });
    expect(w.find('[data-state="error"]').exists()).toBe(true);
    expect(w.text()).toContain('The plan service hit a snag');
  });

  it('renders the malformed-response state distinctly', () => {
    const w = mountCatalog({
      status: 'error',
      error: new NutritionApiError(200, {
        code: 'INTERNAL',
        message: 'Malformed response from the plan service',
      }),
    });
    expect(w.text()).toContain('unexpected format');
  });

  it('falls back to a server message when no error object is supplied', () => {
    const w = mountCatalog({ status: 'error', error: null });
    expect(w.find('[data-state="error"]').exists()).toBe(true);
    expect(w.text()).toContain('The plan service hit a snag');
  });
});

describe('no unhandled exceptions in UI event handlers', () => {
  it('clicking every row (enabled and disabled) never throws', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const w = mountCatalog();
      const picks = w.findAll('.fp-pick');
      expect(picks.length).toBeGreaterThan(0);
      for (const pick of picks) {
        await pick.trigger('click');
      }
      // Toggling twice returns to the same state without throwing.
      for (const pick of picks) {
        await pick.trigger('click');
      }
    } finally {
      spy.mockRestore();
    }
  });

  it('re-rendering into every state with selections never throws', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const w = mountCatalog({ selected: [maurtenProducts[0].id] });
      for (const status of ['loading', 'error', 'ready'] as const) {
        await w.setProps({
          status,
          error:
            status === 'error'
              ? new NutritionApiError(0, { code: 'NETWORK', message: 'down' })
              : null,
        });
        await Promise.all(w.findAll('.fp-pick').map((p) => p.trigger('click')));
      }
    } finally {
      spy.mockRestore();
    }
  });
});

describe('renders product metadata from the contract shape', () => {
  it('shows name, format label, carbs and unit price per row', () => {
    const w = mountCatalog();
    const p = maurtenProducts[0] as Product;
    const row = w.findAll('.fp-product').find((r) => r.text().includes(p.name))!;
    expect(row.text()).toContain('GEL');
    expect(row.text()).toContain(`${p.carbsG} g`);
    expect(row.text()).toContain(`$${p.unitPrice.toFixed(2)}`);
  });
});
