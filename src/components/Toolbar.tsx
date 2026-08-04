interface Props {
  canGenerate: boolean;
  canExport: boolean;
  generating: boolean;
  onGenerate: () => void;
  onExport: () => void;
}

export function Toolbar({ canGenerate, canExport, generating, onGenerate, onExport }: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-brand">Planogram Studio</span>
      </div>
      <div className="toolbar-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!canGenerate || generating}
          onClick={onGenerate}
          title={canGenerate ? 'Generate planogram from uploaded products' : 'Upload at least one product image first'}
        >
          {generating ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              Generating…
            </>
          ) : (
            '⚡ Generate Planogram'
          )}
        </button>

        <button
          type="button"
          className="btn btn--secondary"
          disabled={!canExport}
          onClick={onExport}
          title={canExport ? 'Download as PowerPoint' : 'Generate a planogram first'}
        >
          ⬇ Export PPTX
        </button>
      </div>
    </div>
  );
}
