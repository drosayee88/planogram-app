// ─── Fixture type ─────────────────────────────────────────────────────────────

export type FixtureType = 'standard' | 'endcap';

// ─── Store themes ─────────────────────────────────────────────────────────────

export type StoreThemeId =
  | 'generic'
  | 'walmart'
  | 'target'
  | 'costco'
  | 'homedepot'
  | 'walgreens';

export interface StoreTheme {
  id: StoreThemeId;
  label: string;
  /** Hex accent used on the picker button */
  brandColor: string;
}

export const STORE_THEMES: StoreTheme[] = [
  { id: 'generic',   label: 'Generic',     brandColor: '#57606a' },
  { id: 'walmart',   label: 'Walmart',     brandColor: '#0071ce' },
  { id: 'target',    label: 'Target',      brandColor: '#cc0000' },
  { id: 'costco',    label: 'Costco',      brandColor: '#005daa' },
  { id: 'homedepot', label: 'Home Depot',  brandColor: '#f96302' },
  { id: 'walgreens', label: 'Walgreens',   brandColor: '#e0151f' },
];

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
