import type { FixtureType, ShelfLayout } from '../types/planogram';

interface Props {
  layout: ShelfLayout;
  fixtureType: FixtureType;
  onChange: (layout: ShelfLayout) => void;
  onFixtureTypeChange: (t: FixtureType) => void;
}

export function LayoutConfigurator({ layout, fixtureType, onChange, onFixtureTypeChange }: Props) {
  function update(patch: Partial<ShelfLayout>) {
    onChange({ ...layout, ...patch });
  }

  return (
    <section className="panel">
      <h2 className="panel-title">
        <span className="panel-icon">🏪</span> Store Layout
      </h2>

      {/* ── Fixture type toggle ── */}
      <div className="fixture-toggle">
        <button
          type="button"
          className={`fixture-toggle-btn${fixtureType === 'standard' ? ' fixture-toggle-btn--active' : ''}`}
          onClick={() => onFixtureTypeChange('standard')}
        >
          <span className="fixture-toggle-icon">
            {/* Standard shelf icon — flat horizontal lines */}
            <svg width="36" height="28" viewBox="0 0 36 28" aria-hidden="true">
              <rect x="2" y="4"  width="32" height="5" rx="1" fill="currentColor" opacity=".8"/>
              <rect x="2" y="12" width="32" height="5" rx="1" fill="currentColor" opacity=".8"/>
              <rect x="2" y="20" width="32" height="5" rx="1" fill="currentColor" opacity=".8"/>
              <rect x="2" y="4"  width="2" height="21" fill="currentColor"/>
              <rect x="32" y="4" width="2" height="21" fill="currentColor"/>
            </svg>
          </span>
          <span className="fixture-toggle-label">Standard</span>
          <span className="fixture-toggle-desc">Aisle shelves</span>
        </button>

        <button
          type="button"
          className={`fixture-toggle-btn${fixtureType === 'endcap' ? ' fixture-toggle-btn--active' : ''}`}
          onClick={() => onFixtureTypeChange('endcap')}
        >
          <span className="fixture-toggle-icon">
            {/* End-cap icon — slight 3-D wedge shape */}
            <svg width="36" height="28" viewBox="0 0 36 28" aria-hidden="true">
              {/* front face */}
              <rect x="6" y="6"  width="24" height="4" rx="1" fill="currentColor" opacity=".9"/>
              <rect x="6" y="13" width="24" height="4" rx="1" fill="currentColor" opacity=".9"/>
              <rect x="6" y="20" width="24" height="4" rx="1" fill="currentColor" opacity=".9"/>
              {/* right side panel */}
              <polygon points="30,6 36,2 36,26 30,24" fill="currentColor" opacity=".4"/>
              {/* top fascia */}
              <polygon points="6,6 30,6 36,2 12,2" fill="currentColor" opacity=".6"/>
            </svg>
          </span>
          <span className="fixture-toggle-label">End-cap</span>
          <span className="fixture-toggle-desc">High-visibility display</span>
        </button>
      </div>

      {/* ── Layout inputs ── */}
      <div className="config-grid">
        <label className="config-field">
          <span className="config-label">Shelves</span>
          <input
            type="number"
            min={1}
            max={fixtureType === 'endcap' ? 6 : 10}
            value={layout.shelves}
            onChange={(e) =>
              update({ shelves: Math.max(1, Math.min(fixtureType === 'endcap' ? 6 : 10, Number(e.target.value))) })
            }
            className="config-input"
          />
        </label>

        <label className="config-field">
          <span className="config-label">Slots per shelf</span>
          <input
            type="number"
            min={1}
            max={fixtureType === 'endcap' ? 6 : 20}
            value={layout.slotsPerShelf}
            onChange={(e) =>
              update({ slotsPerShelf: Math.max(1, Math.min(fixtureType === 'endcap' ? 6 : 20, Number(e.target.value))) })
            }
            className="config-input"
          />
        </label>

        <label className="config-field config-field--wide">
          <span className="config-label">Fixture label</span>
          <input
            type="text"
            placeholder={fixtureType === 'endcap' ? 'e.g. End-cap – Seasonal' : 'e.g. Aisle 3 – Beverages'}
            value={layout.label ?? ''}
            onChange={(e) => update({ label: e.target.value })}
            className="config-input"
          />
        </label>
      </div>

      <p className="config-summary">
        {fixtureType === 'endcap' && <span className="config-badge">END-CAP</span>}
        {layout.shelves} shelf rows × {layout.slotsPerShelf} slots ={' '}
        <strong>{layout.shelves * layout.slotsPerShelf}</strong> total positions
      </p>
    </section>
  );
}
