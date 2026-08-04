import { useReducer, useState, useRef } from 'react';
import type { FixtureType, PlanogramAction, PlanogramState, Planogram, ShelfLayout, StoreThemeId } from './types/planogram';
import { buildEmptyPlanogram, buildHardcodedPlanogram } from './services/planogramService';
import { exportToPptx } from './services/exportService';
import { ProductUploader } from './components/ProductUploader';
import { LayoutConfigurator } from './components/LayoutConfigurator';
import { PlanogramCanvas } from './components/PlanogramCanvas';
import { StoreThemePicker } from './components/StoreThemePicker';
import { Toolbar } from './components/Toolbar';
import './App.css';

// ── Reducer ──────────────────────────────────────────────────────────────────

const initialState: PlanogramState = {
  products: [],
  planogram: null,
  generating: false,
  error: null,
};

function reducer(state: PlanogramState, action: PlanogramAction): PlanogramState {
  switch (action.type) {
    case 'ADD_PRODUCTS':
      return { ...state, products: [...state.products, ...action.products] };
    case 'REMOVE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.id),
        planogram: state.planogram
          ? {
              ...state.planogram,
              placements: state.planogram.placements.filter((pl) => pl.productId !== action.id),
            }
          : null,
      };
    case 'MOVE_PLACEMENT': {
      if (!state.planogram) return state;
      const placements = state.planogram.placements.map((pl) => ({ ...pl }));
      const fromIdx = placements.findIndex(
        (pl) => pl.shelf === action.from.shelf && pl.slot === action.from.slot,
      );
      const toIdx = placements.findIndex(
        (pl) => pl.shelf === action.to.shelf && pl.slot === action.to.slot,
      );
      if (fromIdx === -1) return state;
      if (toIdx === -1) {
        placements[fromIdx] = { ...placements[fromIdx], shelf: action.to.shelf, slot: action.to.slot };
      } else {
        placements[fromIdx] = { ...placements[fromIdx], shelf: action.to.shelf, slot: action.to.slot };
        placements[toIdx]   = { ...placements[toIdx],   shelf: action.from.shelf, slot: action.from.slot };
      }
      const updated: Planogram = { ...state.planogram, placements };
      return { ...state, planogram: updated };
    }
    case 'SET_PLANOGRAM':
      return { ...state, planogram: action.planogram };
    case 'SET_GENERATING':
      return { ...state, generating: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.message };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ── Default layout ────────────────────────────────────────────────────────────

const DEFAULT_LAYOUT: ShelfLayout = {
  shelves: 4,
  slotsPerShelf: 6,
  label: 'Main Floor Fixture',
};

// ── Over-capacity dialog ──────────────────────────────────────────────────────

interface OverCapacityDialogProps {
  productCount: number;
  capacity: number;
  onContinue: () => void;
  onCancel: () => void;
}

function OverCapacityDialog({ productCount, capacity, onContinue, onCancel }: OverCapacityDialogProps) {
  const overflow = productCount - capacity;
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overcapacity-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-icon">⚠</span>
          <h3 id="overcapacity-title" className="modal-title">Too many products</h3>
        </div>
        <p className="modal-body">
          You have <strong>{productCount} products</strong> but the current layout only
          has <strong>{capacity} slot{capacity !== 1 ? 's' : ''}</strong> ({overflow} product{overflow !== 1 ? 's' : ''} won't fit).
          <br /><br />
          You can <strong>continue anyway</strong> and the first {capacity} products will be placed,
          or <strong>cancel</strong> and adjust your layout or remove some products.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={onContinue}>
            Continue with {capacity} products
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm-move dialog ───────────────────────────────────────────────────────

interface SlotCoord { shelf: number; slot: number }

interface ConfirmMoveDialogProps {
  from: SlotCoord;
  to: SlotCoord;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmMoveDialog({ from, to, onConfirm, onCancel }: ConfirmMoveDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-icon">⚠</span>
          <h3 id="confirm-title" className="modal-title">Move product?</h3>
        </div>
        <p className="modal-body">
          You are about to move a product from{' '}
          <strong>Shelf {from.shelf + 1}, Slot {from.slot + 1}</strong> to{' '}
          <strong>Shelf {to.shelf + 1}, Slot {to.slot + 1}</strong>.
          {' '}This will update your planogram layout.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm}>
            Move product
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [layout, setLayout] = useState<ShelfLayout>(DEFAULT_LAYOUT);
  const [theme, setTheme] = useState<StoreThemeId>('generic');
  const [fixtureType, setFixtureType] = useState<FixtureType>('standard');

  // Pending move waiting for user confirmation
  const pendingMove = useRef<{ from: SlotCoord; to: SlotCoord } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Over-capacity confirm
  const [overCapacityOpen, setOverCapacityOpen] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleGenerate(forceOverCapacity = false) {
    const capacity = layout.shelves * layout.slotsPerShelf;
    const overflow = state.products.length - capacity;

    // If more products than slots, warn first (unless user already confirmed)
    if (overflow > 0 && !forceOverCapacity) {
      setOverCapacityOpen(true);
      return;
    }

    dispatch({ type: 'SET_GENERATING', value: true });
    dispatch({ type: 'SET_ERROR', message: null });
    try {
      const planogram = buildHardcodedPlanogram(state.products, layout);
      dispatch({ type: 'SET_PLANOGRAM', planogram });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: String(err) });
    } finally {
      dispatch({ type: 'SET_GENERATING', value: false });
    }
  }

  async function handleExport() {
    if (!state.planogram) return;
    try {
      await exportToPptx(state.planogram, state.products, layout.label ?? 'Planogram', theme);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: `Export failed: ${String(err)}` });
    }
  }

  // Called by PlanogramCanvas when a drag-and-drop completes
  function handleMoveRequest(from: SlotCoord, to: SlotCoord) {
    pendingMove.current = { from, to };
    setConfirmOpen(true);
  }

  function handleConfirmMove() {
    if (pendingMove.current) {
      dispatch({ type: 'MOVE_PLACEMENT', ...pendingMove.current });
      pendingMove.current = null;
    }
    setConfirmOpen(false);
  }

  function handleCancelMove() {
    pendingMove.current = null;
    setConfirmOpen(false);
  }

  const displayPlanogram = state.planogram ?? buildEmptyPlanogram();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Toolbar
        canGenerate={state.products.length > 0}
        canExport={state.planogram !== null}
        generating={state.generating}
        onGenerate={handleGenerate}
        onExport={handleExport}
      />

      {state.error && (
        <div className="error-banner" role="alert">
          <strong>Error:</strong> {state.error}
          <button
            type="button"
            className="error-dismiss"
            onClick={() => dispatch({ type: 'SET_ERROR', message: null })}
          >
            ×
          </button>
        </div>
      )}

      <main className="app-main">
        <aside className="sidebar">
          <ProductUploader
            products={state.products}
            onAdd={(products) => dispatch({ type: 'ADD_PRODUCTS', products })}
            onRemove={(id) => dispatch({ type: 'REMOVE_PRODUCT', id })}
          />
          <LayoutConfigurator
            layout={layout}
            fixtureType={fixtureType}
            onChange={setLayout}
            onFixtureTypeChange={setFixtureType}
          />
          <StoreThemePicker value={theme} onChange={setTheme} />
        </aside>

        <div className="canvas-area">
          <div className="canvas-header">
            <h2 className="canvas-title">Planogram Preview</h2>
            {state.planogram === null && (
              <p className="canvas-empty-hint">
                Upload product images and click <strong>⚡ Generate Planogram</strong> to begin.
              </p>
            )}
          </div>
          <PlanogramCanvas
            planogram={displayPlanogram}
            products={state.products}
            theme={theme}
            fixtureType={fixtureType}
            editable={state.planogram !== null}
            onMove={handleMoveRequest}
          />
        </div>
      </main>

      {overCapacityOpen && (
        <OverCapacityDialog
          productCount={state.products.length}
          capacity={layout.shelves * layout.slotsPerShelf}
          onContinue={() => { setOverCapacityOpen(false); handleGenerate(true); }}
          onCancel={() => setOverCapacityOpen(false)}
        />
      )}

      {confirmOpen && pendingMove.current && (
        <ConfirmMoveDialog
          from={pendingMove.current.from}
          to={pendingMove.current.to}
          onConfirm={handleConfirmMove}
          onCancel={handleCancelMove}
        />
      )}
    </div>
  );
}
