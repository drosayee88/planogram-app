// ─── Core domain types ────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  /** object URL or data URL of the product image */
  imageUrl: string;
  /** width  in shelf-slot units (default 1) */
  width?: number;
  /** height in shelf-slot units (default 1) */
  height?: number;
}

export interface Placement {
  productId: string;
  /** 0-indexed shelf row (top = 0) */
  shelf: number;
  /** 0-indexed column slot */
  slot: number;
  /** side-by-side facing count */
  facings: number;
}

export interface ShelfLayout {
  /** number of horizontal shelf rows */
  shelves: number;
  /** number of columns (slots) per shelf */
  slotsPerShelf: number;
  /** label shown below the fixture, e.g. "Aisle 3 – Beverages" */
  label?: string;
}

export interface Planogram {
  layout: ShelfLayout;
  placements: Placement[];
}

// ─── State & Actions ──────────────────────────────────────────────────────────

export interface PlanogramState {
  products: Product[];
  planogram: Planogram | null;
  /** true while LLM is generating a placement */
  generating: boolean;
  error: string | null;
}

export type PlanogramAction =
  | { type: 'ADD_PRODUCTS'; products: Product[] }
  | { type: 'REMOVE_PRODUCT'; id: string }
  | { type: 'SET_PLANOGRAM'; planogram: Planogram }
  | { type: 'SET_GENERATING'; value: boolean }
  | { type: 'SET_ERROR'; message: string | null }
  | { type: 'RESET' }
  | {
      type: 'MOVE_PLACEMENT';
      from: { shelf: number; slot: number };
      to: { shelf: number; slot: number };
    };

// ─── LLM contract (Phase 2) ───────────────────────────────────────────────────

export interface LLMPlanogramResponse {
  layout: ShelfLayout;
  placements: Placement[];
}
