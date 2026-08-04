import { STORE_THEMES } from '../types/planogram';
import type { StoreThemeId } from '../types/planogram';

interface Props {
  value: StoreThemeId;
  onChange: (id: StoreThemeId) => void;
}

export function StoreThemePicker({ value, onChange }: Props) {
  return (
    <section className="panel">
      <h2 className="panel-title">
        <span className="panel-icon">🏬</span> Store Background
      </h2>
      <div className="theme-grid">
        {STORE_THEMES.map((theme) => {
          const active = value === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              className={`theme-btn${active ? ' theme-btn--active' : ''}`}
              style={{ '--brand': theme.brandColor } as React.CSSProperties}
              onClick={() => onChange(theme.id)}
              title={theme.label}
            >
              <span className="theme-swatch" />
              <span className="theme-label">{theme.label}</span>
              {active && <span className="theme-check">✓</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
