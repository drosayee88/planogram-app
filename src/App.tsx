import { useReducer, useState, useRef } from 'react';
import type { PlanogramAction, PlanogramState, Planogram, ShelfLayout } from './types/planogram';
import { buildEmptyPlanogram, buildHardcodedPlanogram } from './services/planogramService';
import { exportToPptx } from './services/exportService';
import { ProductUploader } from './components/ProductUploader';
import { LayoutConfigurator } from './components/LayoutConfigurator';
import { PlanogramCanvas } from './components/PlanogramCanvas';
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

  // Pending move waiting for user confirmation
  const pendingMove = useRef<{ from: SlotCoord; to: SlotCoord } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    dispatch({ type: 'SET_GENERATING', value: true });
    dispatch({ type: 'SET_ERROR', message: null });
    try {
      const planogram = buildHardcodedPlanogram(state.products);
      planogram.layout = { ...planogram.layout, ...layout };
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
      await exportToPptx(state.planogram, state.products, layout.label ?? 'Planogram');
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
          <LayoutConfigurator layout={layout} onChange={setLayout} />
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
            editable={state.planogram !== null}
            onMove={handleMoveRequest}
          />
        </div>
      </main>

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
