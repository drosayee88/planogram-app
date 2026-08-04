import type { Planogram, Product, ShelfLayout } from '../types/planogram';

/**
 * Generates a planogram from the supplied products using the given layout.
 * Products are placed left-to-right, top-to-bottom.
 * Excess products (beyond shelves × slotsPerShelf) are silently dropped —
 * the caller is responsible for warning the user before calling this.
 *
 * Phase 2: replace this with a call to llmService.generatePlanogram().
 */
export function buildHardcodedPlanogram(products: Product[], layout: ShelfLayout): Planogram {
  const { shelves, slotsPerShelf } = layout;
  const capacity = shelves * slotsPerShelf;

  const placements = products.slice(0, capacity).map((p, i) => ({
    productId: p.id,
    shelf: Math.floor(i / slotsPerShelf),
    slot: i % slotsPerShelf,
    facings: 1,
  }));

  return { layout, placements };
}

/**
 * Stub fixture used when no products have been uploaded yet.
 * Returns an empty 4×6 planogram so the canvas renders immediately.
 */
export function buildEmptyPlanogram(): Planogram {
  return {
    layout: { shelves: 4, slotsPerShelf: 6, label: 'Main Floor Fixture' },
    placements: [],
  };
}
