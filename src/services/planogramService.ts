import type { Planogram, Product } from '../types/planogram';

/**
 * Generates a hardcoded planogram from the supplied products.
 * Products are placed left-to-right, top-to-bottom across a 4-shelf fixture
 * with 6 slots per shelf.  Each product occupies 1 facing.
 *
 * Phase 2: replace this with a call to llmService.generatePlanogram().
 */
export function buildHardcodedPlanogram(products: Product[]): Planogram {
  const SHELVES = 4;
  const SLOTS = 6;

  const placements = products.slice(0, SHELVES * SLOTS).map((p, i) => ({
    productId: p.id,
    shelf: Math.floor(i / SLOTS),
    slot: i % SLOTS,
    facings: 1,
  }));

  return {
    layout: {
      shelves: SHELVES,
      slotsPerShelf: SLOTS,
      label: 'Main Floor Fixture',
    },
    placements,
  };
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
