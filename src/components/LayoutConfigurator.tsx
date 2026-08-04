import type { ShelfLayout } from '../types/planogram';

interface Props {
  layout: ShelfLayout;
  onChange: (layout: ShelfLayout) => void;
}

export function LayoutConfigurator({ layout, onChange }: Props) {
  function update(patch: Partial<ShelfLayout>) {
    onChange({ ...layout, ...patch });
  }

  return (
    <section className="panel">
      <h2 className="panel-title">
        <span className="panel-icon">🏪</span> Store Layout
      </h2>

      <div className="config-grid">
        <label className="config-field">
          <span className="config-label">Shelves</span>
          <input
            type="number"
            min={1}
            max={10}
            value={layout.shelves}
            onChange={(e) => update({ shelves: Math.max(1, Math.min(10, Number(e.target.value))) })}
            className="config-input"
          />
        </label>

        <label className="config-field">
          <span className="config-label">Slots per shelf</span>
          <input
            type="number"
            min={1}
            max={20}
            value={layout.slotsPerShelf}
            onChange={(e) =>
              update({ slotsPerShelf: Math.max(1, Math.min(20, Number(e.target.value))) })
            }
            className="config-input"
          />
        </label>

        <label className="config-field config-field--wide">
          <span className="config-label">Fixture label</span>
          <input
            type="text"
            placeholder="e.g. Aisle 3 – Beverages"
            value={layout.label ?? ''}
            onChange={(e) => update({ label: e.target.value })}
            className="config-input"
          />
        </label>
      </div>

      <p className="config-summary">
        {layout.shelves} shelf rows × {layout.slotsPerShelf} slots ={' '}
        <strong>{layout.shelves * layout.slotsPerShelf}</strong> total positions
      </p>
    </section>
  );
}
