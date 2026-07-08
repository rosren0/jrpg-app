# Inventory Grid + Drag & Drop — Implementation Plan

## Goal

Replace the current list layout in `views/inventory.js` with a fixed-size grid (like a JRPG item bag), where each cell can hold one item. Items can be repositioned by drag and drop. Clicking a cell that holds an item selects it (showing details in the right panel as today). Empty cells are visually distinct but clickable to add a new item.

---

## Visual Design

Reference: dark RPG inventory grid (see screenshot provided). Each cell is a square tile with a subtle dark background and a visible border. Occupied cells show the item icon centered inside. The selected cell gets a glowing blue border (`--border-glow` / `--accent-blue`). An item being dragged becomes semi-transparent.

**Grid spec:**
- 5 columns × N rows (rows auto-expand when all slots are filled)
- Fixed cell size: `72px × 72px`
- Gap: `4px`
- Cell background: `var(--bg-hover)` (empty), `var(--bg-card)` (occupied)
- Cell border: `1px solid var(--border)`
- Selected border: `2px solid var(--accent-blue)` + `box-shadow: 0 0 8px var(--border-glow)`
- Item icon: centered, `36px`, category color tint
- Item name: small label below icon, `10px`, truncated with ellipsis

---

## Data Model Change

Each item needs a **slot index** so the grid position is persisted.

Add `slot: number` to the item object (0-based, same order as the grid cells).

```js
// When adding a new item, assign the first free slot:
function firstFreeSlot(inventory, totalSlots) {
  const used = new Set(inventory.map(i => i.slot));
  for (let i = 0; i < totalSlots; i++) {
    if (!used.has(i)) return i;
  }
  return totalSlots; // expand grid
}
```

Existing items without a `slot` field get assigned sequential slots on first render (migration in `App.ensureFields` or at render time).

---

## Grid Rendering

Replace the `itemsHTML` list in `render()` with a grid renderer:

```js
const COLS = 5;
const totalSlots = Math.max(COLS * 3, Math.ceil((filtered.length + 1) / COLS) * COLS);

function renderGrid(filtered) {
  const bySlot = {};
  filtered.forEach(item => { bySlot[item.slot] = item; });

  const cells = [];
  for (let i = 0; i < totalSlots; i++) {
    const item = bySlot[i];
    if (item) {
      cells.push(`
        <div class="inv-cell inv-cell--occupied ${selectedItemId === item.id ? 'inv-cell--selected' : ''}"
             data-slot="${i}" data-item="${item.id}" draggable="true">
          <div class="inv-cell-icon">${Icon.catIcon(item.category, 36)}</div>
          <div class="inv-cell-label">${item.name}</div>
        </div>`);
    } else {
      cells.push(`<div class="inv-cell inv-cell--empty" data-slot="${i}"></div>`);
    }
  }
  return `<div class="inv-grid">${cells.join('')}</div>`;
}
```

---

## Drag & Drop Logic

Use the native HTML5 Drag and Drop API (no library needed).

```
dragstart  → store dragged item id + source slot
dragover   → preventDefault to allow drop, add visual highlight class
dragleave  → remove highlight
drop       → swap slots between source and target
dragend    → clean up
```

**Swap behavior:** if the target slot is occupied, swap the two items' `slot` values. If empty, move the dragged item there.

```js
function attachDragDrop() {
  let draggedId = null;
  let sourceSlot = null;

  app.querySelectorAll('.inv-cell[draggable]').forEach(el => {
    el.addEventListener('dragstart', e => {
      draggedId = el.dataset.item;
      sourceSlot = +el.dataset.slot;
      el.classList.add('inv-cell--dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('inv-cell--dragging');
      draggedId = null; sourceSlot = null;
    });
  });

  app.querySelectorAll('.inv-cell').forEach(el => {
    el.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      el.classList.add('inv-cell--drag-over');
    });
    el.addEventListener('dragleave', () => el.classList.remove('inv-cell--drag-over'));
    el.addEventListener('drop', e => {
      e.preventDefault();
      el.classList.remove('inv-cell--drag-over');
      const targetSlot = +el.dataset.slot;
      if (targetSlot === sourceSlot || draggedId === null) return;

      const dragged = s.inventory.find(i => i.id === draggedId);
      const occupant = s.inventory.find(i => i.slot === targetSlot);
      if (occupant) occupant.slot = sourceSlot; // swap
      dragged.slot = targetSlot;

      App.save(); render();
    });
  });
}
```

---

## CSS to Add (in `styles.css`)

```css
/* Inventory Grid */
.inv-grid {
  display: grid;
  grid-template-columns: repeat(5, 72px);
  gap: 4px;
  padding: 12px;
}

.inv-cell {
  width: 72px; height: 72px;
  border: 1px solid var(--border);
  border-radius: 4px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  overflow: hidden;
  position: relative;
}

.inv-cell--empty {
  background: var(--bg-hover);
}

.inv-cell--occupied {
  background: var(--bg-card);
}

.inv-cell--occupied:hover {
  border-color: rgba(76,194,255,0.3);
}

.inv-cell--selected {
  border: 2px solid var(--accent-blue);
  box-shadow: 0 0 8px var(--border-glow);
}

.inv-cell--dragging {
  opacity: 0.4;
}

.inv-cell--drag-over {
  border-color: var(--accent-blue);
  background: var(--bg-hover);
}

.inv-cell-icon {
  display: flex; align-items: center; justify-content: center;
  color: var(--accent-blue);
}

.inv-cell-label {
  font-size: 9px;
  color: var(--text-muted);
  text-align: center;
  max-width: 68px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
  padding: 0 2px;
}
```

---

## Touch Support (Mobile)

Native HTML5 drag-and-drop does not fire on touch screens. After the desktop version is stable, add a `touchstart` / `touchmove` / `touchend` handler that maps touch coordinates to grid cells using `document.elementFromPoint`.

---

## Files to Change

| File | Change |
|---|---|
| `views/inventory.js` | Replace list renderer with grid renderer + drag-and-drop handlers |
| `styles.css` | Add `.inv-grid`, `.inv-cell`, and modifier classes |
| `app.js` | `ensureFields` — assign `slot` to existing items without one |

No new files needed.

---

## Migration of Existing Items

In `App.ensureFields()`:

```js
// Assign slots to legacy items that don't have one
let nextSlot = 0;
const usedSlots = new Set(s.inventory.filter(i => i.slot != null).map(i => i.slot));
s.inventory.forEach(item => {
  if (item.slot == null) {
    while (usedSlots.has(nextSlot)) nextSlot++;
    item.slot = nextSlot;
    usedSlots.add(nextSlot);
    nextSlot++;
  }
});
```

---

## Out of Scope (Not Planned Here)

- Item stacking (quantity)
- Drag between location tabs (items change location when dropped into a filtered tab)
- Touch/mobile drag (follow-up task)
