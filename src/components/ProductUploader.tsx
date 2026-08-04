import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import type { Product } from '../types/planogram';

interface Props {
  products: Product[];
  onAdd: (products: Product[]) => void;
  onRemove: (id: string) => void;
}

export function ProductUploader({ products, onAdd, onRemove }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const newProducts: Product[] = accepted.map((file) => ({
        id: uuidv4(),
        name: file.name.replace(/\.[^.]+$/, ''),
        imageUrl: URL.createObjectURL(file),
      }));
      onAdd(newProducts);
    },
    [onAdd],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    multiple: true,
  });

  return (
    <section className="panel">
      <h2 className="panel-title">
        <span className="panel-icon">📦</span> Products
        <span className="panel-badge">{products.length}</span>
      </h2>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-inner">
          <div className="dropzone-icon">⬆</div>
          <p className="dropzone-text">
            {isDragActive ? 'Drop images here…' : 'Drag product images here, or click to select'}
          </p>
          <p className="dropzone-hint">PNG, JPG, WebP accepted</p>
        </div>
      </div>

      {products.length > 0 && (
        <div className="thumbnail-grid">
          {products.map((p) => (
            <div key={p.id} className="thumbnail-item">
              <div className="thumbnail-img-wrap">
                <img src={p.imageUrl} alt={p.name} className="thumbnail-img" />
                <button
                  type="button"
                  className="thumbnail-remove"
                  title={`Remove ${p.name}`}
                  onClick={() => onRemove(p.id)}
                >
                  ×
                </button>
              </div>
              <p className="thumbnail-name">{p.name}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
