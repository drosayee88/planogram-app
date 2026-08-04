import { useState } from 'react';
import type { Planogram, Product, StoreThemeId } from '../types/planogram';

interface SlotCoord { shelf: number; slot: number }

interface Props {
  planogram: Planogram;
  products: Product[];
  theme?: StoreThemeId;
  /** When false the grid is read-only (no planogram generated yet) */
  editable?: boolean;
  onMove?: (from: SlotCoord, to: SlotCoord) => void;
}

// Key written into dataTransfer so the drop handler always has the source
// even if the dragend/drop event order varies between browsers.
const DND_KEY = 'application/x-planogram-slot';

export function PlanogramCanvas({ planogram, products, theme = 'generic', editable = false, onMove }: Props) {
  const { layout, placements } = planogram;
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Build lookup: "shelf-slot" → Placement
  const placementMap = new Map(
    placements.map((pl) => [`${pl.shelf}-${pl.slot}`, pl]),
  );

  // Both dragSource and dragOver live in state so every change triggers a render.
  const [dragSource, setDragSource] = useState<SlotCoord | null>(null);
  const [dragOver,   setDragOver]   = useState<SlotCoord | null>(null);

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, coord: SlotCoord) {
    e.dataTransfer.setData(DND_KEY, JSON.stringify(coord));
    e.dataTransfer.effectAllowed = 'move';
    // Use the slot's own img as the drag ghost so the visual matches the tile
    const img = (e.currentTarget as HTMLElement).querySelector('img');
    if (img) e.dataTransfer.setDragImage(img, img.offsetWidth / 2, img.offsetHeight / 2);
    setDragSource(coord);
  }

  function handleDragEnd() {
    setDragSource(null);
    setDragOver(null);
  }

  function handleDragOver(e: React.DragEvent, coord: SlotCoord) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Only update state if the hovered slot actually changed (avoids thrashing)
    setDragOver((prev) =>
      prev?.shelf === coord.shelf && prev?.slot === coord.slot ? prev : coord,
    );
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear when we leave the slot div itself, not a child element
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(null);
  }

  function handleDrop(e: React.DragEvent, to: SlotCoord) {
    e.preventDefault();
    setDragSource(null);
    setDragOver(null);

    // Read source from dataTransfer — guaranteed to survive the event order
    const raw = e.dataTransfer.getData(DND_KEY);
    if (!raw || !onMove) return;

    let from: SlotCoord;
    try { from = JSON.parse(raw) as SlotCoord; }
    catch { return; }

    if (from.shelf === to.shelf && from.slot === to.slot) return;
    onMove(from, to);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="canvas-wrap" data-theme={theme}>
      {layout.label && <p className="canvas-label">{layout.label}</p>}

      {editable && (
        <p className="canvas-dnd-hint">
          Drag any product tile to a new slot to reposition it.
        </p>
      )}

      <div className="fixture">
        {/* Row labels */}
        <div className="shelf-labels">
          {Array.from({ length: layout.shelves }, (_, i) => (
            <div key={i} className="shelf-row-label">
              S{i + 1}
            </div>
          ))}
        </div>

        {/* Shelves */}
        <div className="shelves">
          {Array.from({ length: layout.shelves }, (_, rowIdx) => (
            <div key={rowIdx} className="shelf-row">
              {Array.from({ length: layout.slotsPerShelf }, (_, colIdx) => {
                const coord: SlotCoord = { shelf: rowIdx, slot: colIdx };
                const key = `${rowIdx}-${colIdx}`;
                const pl = placementMap.get(key);
                const product = pl ? productMap.get(pl.productId) : undefined;

                const isSource = dragSource?.shelf === rowIdx && dragSource?.slot === colIdx;
                const isOver   = dragOver?.shelf   === rowIdx && dragOver?.slot   === colIdx;

                let slotClass = 'slot';
                if (isSource)              slotClass += ' slot--dragging';
                if (isOver && !isSource)   slotClass += ' slot--over';
                if (editable && product)   slotClass += ' slot--draggable';

                return (
                  <div
                    key={colIdx}
                    className={slotClass}
                    // Drag source — only filled slots
                    draggable={editable && !!product}
                    onDragStart={editable && product ? (e) => handleDragStart(e, coord) : undefined}
                    onDragEnd={editable ? handleDragEnd : undefined}
                    // Drop target — every slot
                    onDragOver={editable ? (e) => handleDragOver(e, coord) : undefined}
                    onDragLeave={editable ? handleDragLeave : undefined}
                    onDrop={editable ? (e) => handleDrop(e, coord) : undefined}
                  >
                    {product ? (
                      <>
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="slot-img"
                        />
                        <span className="slot-name" title={product.name}>
                          {product.name}
                        </span>
                      </>
                    ) : (
                      <span className="slot-empty" aria-label="empty slot" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="canvas-legend">
        <span className="legend-item">
          <span className="legend-dot legend-dot--filled" />
          Placed ({placements.length})
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-dot--empty" />
          Empty ({layout.shelves * layout.slotsPerShelf - placements.length})
        </span>
        {editable && (
          <span className="legend-item legend-item--hint">
            ✦ Drag &amp; drop to reposition
          </span>
        )}
      </div>
    </div>
  );
}
