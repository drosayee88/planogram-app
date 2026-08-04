import pptxgen from 'pptxgenjs';
import type { Planogram, Product } from '../types/planogram';

/**
 * Renders the planogram as a PowerPoint slide and triggers a browser download.
 *
 * Slide layout:
 *   – Title text at the top
 *   – Shelf rows drawn as grey rectangles
 *   – Each product placement drawn as an image tile with a label beneath it
 */
export async function exportToPptx(
  planogram: Planogram,
  products: Product[],
  title = 'Planogram',
): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 inches

  const slide = pptx.addSlide();

  // ── Slide background ────────────────────────────────────────────────────────
  slide.background = { color: 'FFFFFF' };

  // ── Title ───────────────────────────────────────────────────────────────────
  slide.addText(title, {
    x: 0.3,
    y: 0.15,
    w: 12.7,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: '1f2328',
  });

  if (planogram.layout.label) {
    slide.addText(planogram.layout.label, {
      x: 0.3,
      y: 0.65,
      w: 12.7,
      h: 0.3,
      fontSize: 12,
      color: '57606a',
    });
  }

  // ── Fixture geometry ────────────────────────────────────────────────────────
  const { shelves, slotsPerShelf } = planogram.layout;

  const MARGIN_LEFT = 0.5;   // inches
  const MARGIN_TOP  = 1.1;   // inches below title
  const TOTAL_W     = 12.3;  // inches for the fixture
  const TOTAL_H     = 5.8;   // inches for all shelves
  const SHELF_GAP   = 0.08;  // gap between shelves

  const shelfH = (TOTAL_H - SHELF_GAP * (shelves - 1)) / shelves;
  const slotW  = TOTAL_W / slotsPerShelf;

  const productMap = new Map(products.map((p) => [p.id, p]));

  // ── Draw shelves + products ──────────────────────────────────────────────────
  for (let row = 0; row < shelves; row++) {
    const shelfY = MARGIN_TOP + row * (shelfH + SHELF_GAP);

    // Shelf backing rectangle
    slide.addShape(pptx.ShapeType.rect, {
      x: MARGIN_LEFT,
      y: shelfY,
      w: TOTAL_W,
      h: shelfH,
      fill: { color: 'F7F8FA' },
      line: { color: 'E5E7EB', width: 1 },
    });

    // Shelf label (row number)
    slide.addText(`Shelf ${row + 1}`, {
      x: MARGIN_LEFT - 0.45,
      y: shelfY + shelfH / 2 - 0.12,
      w: 0.4,
      h: 0.24,
      fontSize: 8,
      color: '57606a',
      align: 'right',
    });

    // Products on this shelf
    const rowPlacements = planogram.placements.filter((p) => p.shelf === row);

    for (const placement of rowPlacements) {
      const product = productMap.get(placement.productId);
      if (!product) continue;

      const cellX = MARGIN_LEFT + placement.slot * slotW;
      const cellW = slotW * placement.facings;

      const IMG_PAD  = 0.06;
      const LABEL_H  = 0.22;
      const imgX = cellX + IMG_PAD;
      const imgY = shelfY + IMG_PAD;
      const imgW = cellW - IMG_PAD * 2;
      const imgH = shelfH - IMG_PAD * 2 - LABEL_H;

      // Product image
      try {
        const base64 = await urlToBase64(product.imageUrl);
        const ext = detectImageExt(base64);
        slide.addImage({
          data: base64,
          x: imgX,
          y: imgY,
          w: imgW,
          h: imgH,
          sizing: { type: 'contain', w: imgW, h: imgH },
        } as Parameters<typeof slide.addImage>[0] & { _ext?: string });
      } catch {
        // Fallback: coloured rectangle if image fails
        slide.addShape(pptx.ShapeType.rect, {
          x: imgX, y: imgY, w: imgW, h: imgH,
          fill: { color: 'D1FAE5' },
          line: { color: '059669', width: 1 },
        });
      }

      // Product label
      slide.addText(product.name, {
        x: cellX,
        y: shelfY + shelfH - LABEL_H,
        w: cellW,
        h: LABEL_H,
        fontSize: 7,
        color: '1f2328',
        align: 'center',
        wrap: false,
      });
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  await pptx.writeFile({ fileName: `${title.replace(/\s+/g, '_')}.pptx` });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function urlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function detectImageExt(dataUrl: string): string {
  const m = dataUrl.match(/^data:image\/(\w+);/);
  return m ? m[1] : 'png';
}
