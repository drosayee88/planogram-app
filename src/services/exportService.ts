import pptxgen from 'pptxgenjs';
import type { Planogram, Product, StoreThemeId } from '../types/planogram';

// ── Per-store colour palette ──────────────────────────────────────────────────

interface ThemePalette {
  slideBg:      string;  // slide background hex
  fixtureBg:    string;  // fixture area bg (behind uprights/shelves)
  uprightColor: string;  // left/right upright posts
  shelfFill:    string;  // shelf row main fill
  shelfEdge:    string;  // shelf lip / bottom edge strip colour
  slotFill:     string;  // individual slot background
  slotBorder:   string;  // slot outline
  labelBg:      string;  // product name strip background
  labelColor:   string;  // product name strip text colour
  titleColor:   string;  // slide title text colour
}

const PALETTES: Record<StoreThemeId, ThemePalette> = {
  generic: {
    slideBg:      'FFFFFF',
    fixtureBg:    'F0F0F0',
    uprightColor: 'B0B0B0',
    shelfFill:    'E8E8E8',
    shelfEdge:    'A0A0A0',
    slotFill:     'FFFFFF',
    slotBorder:   'D0D7DE',
    labelBg:      'F7F8FA',
    labelColor:   '57606A',
    titleColor:   '1F2328',
  },
  walmart: {
    slideBg:      'EEF4FB',
    fixtureBg:    'D8E8F8',
    uprightColor: '0071CE',
    shelfFill:    'C8D8F0',
    shelfEdge:    'FFC220',
    slotFill:     'F5FAFF',
    slotBorder:   '7DB8E8',
    labelBg:      'E8F0FA',
    labelColor:   '0071CE',
    titleColor:   '0071CE',
  },
  target: {
    slideBg:      'FFF5F5',
    fixtureBg:    'FFE8E8',
    uprightColor: 'CC0000',
    shelfFill:    'FFE8E8',
    shelfEdge:    'CC0000',
    slotFill:     'FFFAFA',
    slotBorder:   'F0A0A0',
    labelBg:      'FFF0F0',
    labelColor:   'CC0000',
    titleColor:   'CC0000',
  },
  costco: {
    slideBg:      'EAF0F8',
    fixtureBg:    'D0E0F0',
    uprightColor: 'C8363C',
    shelfFill:    'C8D8EC',
    shelfEdge:    'C8363C',
    slotFill:     'F4F8FC',
    slotBorder:   '88AACC',
    labelBg:      'E6EDF5',
    labelColor:   '005DAA',
    titleColor:   '005DAA',
  },
  homedepot: {
    slideBg:      '1A1A1A',
    fixtureBg:    '222222',
    uprightColor: 'F96302',
    shelfFill:    '2A2A2A',
    shelfEdge:    'F96302',
    slotFill:     '2E2E2E',
    slotBorder:   '555555',
    labelBg:      '1A1A1A',
    labelColor:   'F96302',
    titleColor:   'F96302',
  },
  walgreens: {
    slideBg:      'FAFAFA',
    fixtureBg:    'F5F5F5',
    uprightColor: 'E0151F',
    shelfFill:    'F0F0F0',
    shelfEdge:    'E0151F',
    slotFill:     'FFFFFF',
    slotBorder:   'F0A0A0',
    labelBg:      'FFF5F5',
    labelColor:   'E0151F',
    titleColor:   'E0151F',
  },
};

// ── Main export function ──────────────────────────────────────────────────────

/**
 * Renders the planogram as a PowerPoint slide and triggers a browser download.
 *
 * Slide layout:
 *   – Title text at the top
 *   – Fixture background rectangle
 *   – Left / right upright posts
 *   – Shelf rows with themed fill + thick bottom edge (shelf lip)
 *   – Each product placement: image tile + themed label strip beneath it
 */
export async function exportToPptx(
  planogram: Planogram,
  products: Product[],
  title = 'Planogram',
  themeId: StoreThemeId = 'generic',
): Promise<void> {
  const pal = PALETTES[themeId];

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 inches

  const slide = pptx.addSlide();
  slide.background = { color: pal.slideBg };

  // ── Title ─────────────────────────────────────────────────────────────────
  slide.addText(title, {
    x: 0.3, y: 0.1, w: 12.7, h: 0.5,
    fontSize: 20, bold: true, color: pal.titleColor,
  });

  if (planogram.layout.label) {
    slide.addText(planogram.layout.label, {
      x: 0.3, y: 0.6, w: 12.7, h: 0.28,
      fontSize: 12, color: pal.labelColor,
    });
  }

  // ── Fixture geometry ──────────────────────────────────────────────────────
  const { shelves, slotsPerShelf } = planogram.layout;

  const MARGIN_LEFT  = 0.5;
  const MARGIN_TOP   = 1.05;
  const TOTAL_W      = 12.3;
  const TOTAL_H      = 5.85;
  const SHELF_GAP    = 0.08;
  const UPRIGHT_W    = 0.12;   // inches — width of side posts
  const SHELF_EDGE_H = 0.1;    // inches — thick bottom lip on each shelf

  const innerW  = TOTAL_W - UPRIGHT_W * 2;
  const shelfH  = (TOTAL_H - SHELF_GAP * (shelves - 1)) / shelves;
  const slotW   = innerW / slotsPerShelf;

  const productMap = new Map(products.map((p) => [p.id, p]));

  // ── Fixture background ────────────────────────────────────────────────────
  slide.addShape(pptx.ShapeType.rect, {
    x: MARGIN_LEFT, y: MARGIN_TOP,
    w: TOTAL_W, h: TOTAL_H,
    fill: { color: pal.fixtureBg },
    line: { color: pal.uprightColor, width: 1 },
  });

  // ── Left upright ──────────────────────────────────────────────────────────
  slide.addShape(pptx.ShapeType.rect, {
    x: MARGIN_LEFT, y: MARGIN_TOP,
    w: UPRIGHT_W, h: TOTAL_H,
    fill: { color: pal.uprightColor },
    line: { color: pal.uprightColor, width: 0 },
  });

  // ── Right upright ─────────────────────────────────────────────────────────
  slide.addShape(pptx.ShapeType.rect, {
    x: MARGIN_LEFT + TOTAL_W - UPRIGHT_W, y: MARGIN_TOP,
    w: UPRIGHT_W, h: TOTAL_H,
    fill: { color: pal.uprightColor },
    line: { color: pal.uprightColor, width: 0 },
  });

  // ── Draw shelves + products ───────────────────────────────────────────────
  for (let row = 0; row < shelves; row++) {
    const shelfY  = MARGIN_TOP + row * (shelfH + SHELF_GAP);
    const shelfX  = MARGIN_LEFT + UPRIGHT_W;

    // Shelf main fill (everything above the lip)
    slide.addShape(pptx.ShapeType.rect, {
      x: shelfX, y: shelfY,
      w: innerW, h: shelfH - SHELF_EDGE_H,
      fill: { color: pal.shelfFill },
      line: { color: pal.shelfFill, width: 0 },
    });

    // Shelf lip / edge strip (bottom of each shelf row)
    slide.addShape(pptx.ShapeType.rect, {
      x: shelfX, y: shelfY + shelfH - SHELF_EDGE_H,
      w: innerW, h: SHELF_EDGE_H,
      fill: { color: pal.shelfEdge },
      line: { color: pal.shelfEdge, width: 0 },
    });

    // Shelf row number label (left of upright)
    slide.addText(`S${row + 1}`, {
      x: MARGIN_LEFT - 0.4,
      y: shelfY + shelfH / 2 - 0.1,
      w: 0.35, h: 0.2,
      fontSize: 8, color: pal.labelColor, align: 'right',
    });

    // ── Products on this shelf ──────────────────────────────────────────────
    const rowPlacements = planogram.placements.filter((p) => p.shelf === row);

    for (const placement of rowPlacements) {
      const product = productMap.get(placement.productId);
      if (!product) continue;

      const cellX  = shelfX + placement.slot * slotW;
      const cellW  = slotW * placement.facings;

      const IMG_PAD = 0.05;
      const LABEL_H = 0.2;
      const imgX = cellX + IMG_PAD;
      const imgY = shelfY + IMG_PAD;
      const imgW = cellW - IMG_PAD * 2;
      const imgH = shelfH - SHELF_EDGE_H - IMG_PAD * 2 - LABEL_H;

      // Slot background
      slide.addShape(pptx.ShapeType.rect, {
        x: cellX, y: shelfY,
        w: cellW, h: shelfH - SHELF_EDGE_H,
        fill: { color: pal.slotFill },
        line: { color: pal.slotBorder, width: 0.5 },
      });

      // Product image
      try {
        const base64 = await urlToBase64(product.imageUrl);
        slide.addImage({
          data: base64,
          x: imgX, y: imgY,
          w: imgW, h: imgH,
          sizing: { type: 'contain', w: imgW, h: imgH },
        } as Parameters<typeof slide.addImage>[0]);
      } catch {
        // Fallback coloured rect if image fails to load
        slide.addShape(pptx.ShapeType.rect, {
          x: imgX, y: imgY, w: imgW, h: imgH,
          fill: { color: pal.slotBorder },
          line: { color: pal.slotBorder, width: 1 },
        });
      }

      // Label strip background
      slide.addShape(pptx.ShapeType.rect, {
        x: cellX, y: shelfY + shelfH - SHELF_EDGE_H - LABEL_H,
        w: cellW, h: LABEL_H,
        fill: { color: pal.labelBg },
        line: { color: pal.slotBorder, width: 0.5 },
      });

      // Product name text on label strip
      slide.addText(product.name, {
        x: cellX, y: shelfY + shelfH - SHELF_EDGE_H - LABEL_H,
        w: cellW, h: LABEL_H,
        fontSize: 7, color: pal.labelColor,
        align: 'center', wrap: false,
      });
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  await pptx.writeFile({ fileName: `${title.replace(/\s+/g, '_')}.pptx` });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
