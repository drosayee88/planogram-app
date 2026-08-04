# Planogram Studio

A browser-based planogram builder. Upload product images, configure a store fixture, generate a visual shelf layout, rearrange products with drag-and-drop, and export the result as a branded PowerPoint slide — all without a backend.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [How to use](#how-to-use)
3. [Technical architecture](#technical-architecture)
4. [Project structure](#project-structure)
5. [Running locally](#running-locally)
6. [LLM integration (Phase 2)](#llm-integration-phase-2)

---

## What it does

| Feature | Detail |
|---|---|
| **Product upload** | Drag-and-drop (or click-to-browse) any number of PNG / JPG / WebP product images |
| **Layout configuration** | Choose shelf count, slots per shelf, and a fixture label |
| **Fixture types** | **Standard** aisle gondola or **End-cap** high-visibility display with a 3-D chrome surround |
| **Store themes** | Apply a branded shelf skin — Generic, Walmart, Target, Costco, Home Depot, or Walgreens |
| **Planogram generation** | Products are placed left-to-right, top-to-bottom across the fixture automatically |
| **Drag-and-drop editing** | Reorder any product tile by dragging it to a new slot; occupied slots swap |
| **Confirmation dialogs** | Move operations and over-capacity situations both prompt for user confirmation before committing |
| **PowerPoint export** | Downloads a themed `.pptx` slide that mirrors the on-screen visual exactly — slide background, uprights, shelf lip colour, slot fills, and label strips all match the selected store theme |
| **LLM-ready stub** | `llmService.ts` is wired and documented; swap in an API key to replace hardcoded placement with GPT-4o vision-based arrangement |

---

## How to use

### Step 1 — Upload product images

The left sidebar contains the **Products** panel.

- **Drag** one or more image files from your file explorer onto the dashed drop zone, **or** click the zone to open a file picker.
- Each image appears as a thumbnail. Hover a thumbnail and click **×** to remove it.
- There is no limit on the number of images you upload, but the planogram will only place as many as there are slots available (see Step 4).

```
┌────────────────────────────┐
│  📦 Products           (3) │
│  ┌─────────────────────┐   │
│  │  ⬆  Drop images      │   │
│  │     or click         │   │
│  └─────────────────────┘   │
│  [img1] [img2] [img3]      │
└────────────────────────────┘
```

---

### Step 2 — Configure the store layout

The **Store Layout** panel sits below the Products panel.

1. **Fixture type** — click **Standard** (flat aisle gondola) or **End-cap** (compact 3-D end-of-aisle display). End-cap mode caps shelves at 6 and slots at 6.
2. **Shelves** — number of horizontal shelf rows (1–10 for standard, 1–6 for end-cap).
3. **Slots per shelf** — columns per row (1–20 for standard, 1–6 for end-cap).
4. **Fixture label** — optional text shown above the canvas and in the exported slide title area.

The summary line at the bottom of the panel shows the total slot count.

---

### Step 3 — Pick a store theme

The **Store Background** panel lets you apply a branded visual skin.

| Button | Colours applied |
|---|---|
| Generic | Neutral grey gondola |
| Walmart | Blue uprights + yellow shelf lip |
| Target | Red uprights + red shelf lip |
| Costco | Blue frame, red uprights |
| Home Depot | Dark racking with orange accents |
| Walgreens | White pharmacy shelving with red edge |

The theme updates the canvas instantly and carries through to the PowerPoint export.

---

### Step 4 — Generate the planogram

Click **⚡ Generate Planogram** in the top toolbar.

- Products are placed left-to-right, top-to-bottom until the fixture is full.
- If you have **more products than slots**, a confirmation dialog appears:

  > *You have 8 products but the current layout only has 6 slots (2 products won't fit).*
  >
  > **Cancel** — go back and adjust the layout or remove products.  
  > **Continue with 6 products** — place the first 6 and proceed.

---

### Step 5 — Rearrange with drag-and-drop

Once a planogram is generated, every filled slot becomes draggable.

```
Drag & drop walkthrough
───────────────────────
1.  Hover a product tile — cursor changes to a grab hand (✥)
2.  Click and hold the tile
3.  Drag it across the fixture — the source tile fades to 35 % opacity,
    the hovered target slot highlights with a blue glow
4.  Release over any slot (empty or occupied)
5.  A confirmation dialog appears:

      "Move product?"
      You are about to move a product from Shelf 2, Slot 1
      to Shelf 1, Slot 4. This will update your planogram layout.

      [ Cancel ]   [ Move product ]

6.  Click "Move product" to commit — the canvas updates immediately.
    Click "Cancel" to leave the planogram unchanged.

Rules:
  • Dragging onto an empty slot   → moves the product there.
  • Dragging onto an occupied slot → swaps the two products.
  • Dropping on the same slot      → no-op, no dialog shown.
```

---

### Step 6 — Export to PowerPoint

Click **⬇ Export PPTX** in the toolbar (enabled once a planogram exists).

- A `.pptx` file downloads immediately — no server required, everything runs in the browser via [pptxgenjs](https://gitbrent.github.io/PptxGenJS/).
- The slide replicates the on-screen theme: slide background colour, upright post colours, shelf fill, shelf-lip colour, slot backgrounds, and product label strips all match the selected store theme.
- The filename is derived from the fixture label (e.g. `Main_Floor_Fixture.pptx`).

---

## Technical architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (React 19 + Vite)                    │
│                                                                     │
│  ┌──────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │
│  │   Sidebar    │  │    Canvas area       │  │   Modals         │  │
│  │              │  │                      │  │                  │  │
│  │ ProductUploader  PlanogramCanvas       │  │ ConfirmMove      │  │
│  │ LayoutConfig │  │  data-theme={}       │  │ OverCapacity     │  │
│  │ StoreTheme   │  │  data-fixture={}     │  │                  │  │
│  │ Picker       │  │  ├─ Standard fixture │  └──────────────────┘  │
│  └──────┬───────┘  │  └─ Endcap scene    │                         │
│         │          └────────┬────────────┘                         │
│         │                   │                                       │
│         └──────────┬────────┘                                       │
│                    ▼                                                 │
│           App  (useReducer)                                         │
│           state: { products, planogram, generating, error }         │
│           local: { layout, theme, fixtureType }                     │
│                    │                                                 │
│         ┌──────────┼──────────────────┐                             │
│         ▼          ▼                  ▼                             │
│  planogramService  exportService      llmService                    │
│  buildHardcoded()  exportToPptx()     generatePlanogram()  (stub)  │
│  buildEmpty()      PALETTES[theme]    GPT-4o vision API            │
│                    pptxgenjs                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### State management

All planogram state flows through a single `useReducer` in `App.tsx`. Actions:

| Action | Effect |
|---|---|
| `ADD_PRODUCTS` | Appends uploaded products |
| `REMOVE_PRODUCT` | Removes product, strips its placements |
| `SET_PLANOGRAM` | Replaces the entire planogram |
| `MOVE_PLACEMENT` | Moves or swaps two slot positions atomically |
| `SET_GENERATING` | Toggles loading state on the toolbar button |
| `SET_ERROR` | Shows / clears the error banner |
| `RESET` | Returns to initial state |

UI-only state (`layout`, `theme`, `fixtureType`) lives in separate `useState` hooks since it doesn't need to be shared with the reducer.

### Data flow

```
User uploads images
       │
       ▼
  products: Product[]          (id, name, imageUrl)
       │
       ▼
  buildHardcodedPlanogram(products, layout)
       │  uses: layout.shelves, layout.slotsPerShelf
       │  formula: shelf = ⌊i / slotsPerShelf⌋,  slot = i % slotsPerShelf
       ▼
  planogram: { layout, placements: Placement[] }
       │
       ├──▶  PlanogramCanvas  (renders shelf grid, applies CSS vars from theme)
       │
       └──▶  exportToPptx(planogram, products, title, themeId)
                  │
                  └──▶  PALETTES[themeId]  →  pptxgenjs shapes + images
                                              →  .pptx download
```

### Theme system

Store themes are pure CSS custom properties set on `.canvas-wrap[data-theme="..."]`. The canvas HTML never changes — only the variables change, and every child element reads from them.

```css
.canvas-wrap {
  --upright-color:  #b0b0b0;
  --shelf-bg:       #e8e8e8;
  --shelf-edge-color: #a0a0a0;
  --slot-bg:        #ffffff;
  --label-strip-bg: #f7f8fa;
  /* … */
}
.canvas-wrap[data-theme="walmart"] {
  --upright-color:  #0071ce;
  --shelf-edge-color: #ffc220;
  /* … */
}
```

The same palette values are mirrored as a `PALETTES` object in `exportService.ts` so the PowerPoint slide matches.

### Fixture types

`data-fixture="endcap"` wraps the standard `.fixture` grid in three extra elements — `.endcap-top-fascia`, `.endcap-side-panel` (left/right), and `.endcap-base` — all coloured from the same `--upright-color` variable. No transforms are applied to the shelf grid itself so HTML5 drag-and-drop hit-testing remains accurate.

---

## Project structure

```
planogram-app/
├── src/
│   ├── components/
│   │   ├── LayoutConfigurator.tsx  # Shelves / slots / fixture type inputs
│   │   ├── PlanogramCanvas.tsx     # Shelf renderer + drag-and-drop
│   │   ├── ProductUploader.tsx     # Dropzone + thumbnail strip
│   │   ├── StoreThemePicker.tsx    # Brand colour selector
│   │   └── Toolbar.tsx             # Generate + Export buttons
│   ├── services/
│   │   ├── exportService.ts        # pptxgenjs PowerPoint export
│   │   ├── llmService.ts           # LLM placement stub (Phase 2)
│   │   └── planogramService.ts     # Hardcoded fill algorithm
│   ├── types/
│   │   └── planogram.ts            # All TypeScript types + constants
│   ├── App.css                     # All styles (CSS variables + themes)
│   ├── App.tsx                     # Root component, reducer, modals
│   └── main.tsx                    # React entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Running locally

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Type-check
npx tsc --noEmit

# Production build
npm run build
```

---

## LLM integration (Phase 2)

`src/services/llmService.ts` contains a ready-to-use OpenAI-compatible implementation. To activate it:

1. Create a `.env.local` file in the project root:
   ```
   VITE_LLM_API_KEY=sk-...
   ```

2. In `App.tsx`, replace the hardcoded call in `handleGenerate`:
   ```ts
   // Before (Phase 1)
   const planogram = buildHardcodedPlanogram(state.products, layout);

   // After (Phase 2)
   const planogram = await generatePlanogram(state.products, layout);
   ```

3. The service sends each product image (as base64) plus the layout dimensions to the model and expects a JSON response matching `LLMPlanogramResponse` — `{ layout, placements }`. The system prompt instructs the model to act as a retail planogram expert and return only valid JSON.

To use a different provider (Anthropic Claude, Gemini, etc.) update `API_URL` and the request body shape in `llmService.ts`.
