const MIN_ROWS = 1;
const MIN_COLS = 1;

function makeId(prefix) {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${rand}`;
}

function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

function columnLabelFromIndex(index) {
  // 0 -> A, 25 -> Z, 26 -> AA, ...
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function relabelColumns(columns) {
  return columns.map((col, i) => ({
    ...col,
    label: columnLabelFromIndex(i),
  }));
}

function insertAt(arr, index, item) {
  return [...arr.slice(0, index), item, ...arr.slice(index)];
}

function removeAt(arr, index) {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

function moveItem(arr, fromIndex, toIndex) {
  if (fromIndex === toIndex) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

function normalizeTable(raw) {
  const columnsRaw = Array.isArray(raw?.columns) ? raw.columns : [];
  const rowsRaw = Array.isArray(raw?.rows) ? raw.rows : [];

  const colCount = Math.max(MIN_COLS, columnsRaw.length);
  const rowCount = Math.max(MIN_ROWS, rowsRaw.length);

  const columns = relabelColumns(
    Array.from({ length: colCount }, (_, i) => {
      const maybe = columnsRaw[i];
      return {
        id: typeof maybe?.id === "string" ? maybe.id : makeId("col"),
        label: typeof maybe?.label === "string" ? maybe.label : "",
      };
    })
  );

  const rows = Array.from({ length: rowCount }, (_, i) => {
    const maybe = rowsRaw[i];
    const cellsRaw = Array.isArray(maybe?.cells) ? maybe.cells : [];
    const cells = Array.from({ length: colCount }, (_, j) => {
      const v = cellsRaw[j];
      return typeof v === "string" ? v : v == null ? "" : String(v);
    });
    return {
      id: typeof maybe?.id === "string" ? maybe.id : makeId("row"),
      cells,
    };
  });

  //columns: array of objects with id and label
  //rows: array of objects with id and cells
  return { columns, rows };
}

export function createTable({ rowCount = 5, colCount = 5 } = {}) {
  return normalizeTable({
    columns: Array.from({ length: Math.max(MIN_COLS, colCount) }, () => ({
      id: makeId("col"),
    })),
    rows: Array.from({ length: Math.max(MIN_ROWS, rowCount) }, () => ({
      id: makeId("row"),
      cells: [],
    })),
  });
}

export function updateCell(table, rowIndex, colIndex, value) {
  const t = normalizeTable(table);
  if (rowIndex < 0 || rowIndex >= t.rows.length) return t;
  if (colIndex < 0 || colIndex >= t.columns.length) return t;

  const nextRows = t.rows.slice();
  const row = t.rows[rowIndex];
  const nextCells = row.cells.slice();
  nextCells[colIndex] = value;
  nextRows[rowIndex] = { ...row, cells: nextCells };
  return { ...t, rows: nextRows };
}

export function addRow(table, index = Infinity) {
  const t = normalizeTable(table);
  const insertIndex = clampInt(index, 0, t.rows.length);
  const newRow = {
    id: makeId("row"),
    cells: Array.from({ length: t.columns.length }, () => ""),
  };
  return { ...t, rows: insertAt(t.rows, insertIndex, newRow) };
}

export function deleteRow(table, index) {
  const t = normalizeTable(table);
  if (t.rows.length <= MIN_ROWS) return t;
  if (index < 0 || index >= t.rows.length) return t;
  return { ...t, rows: removeAt(t.rows, index) };
}

export function moveRow(table, fromIndex, direction) {
  const t = normalizeTable(table);
  const toIndex = fromIndex + direction;
  if (fromIndex < 0 || fromIndex >= t.rows.length) return t;
  if (toIndex < 0 || toIndex >= t.rows.length) return t;
  return { ...t, rows: moveItem(t.rows, fromIndex, toIndex) };
}

export function moveRowTo(table, fromIndex, toIndex) {
  const t = normalizeTable(table);
  if (fromIndex < 0 || fromIndex >= t.rows.length) return t;
  if (toIndex < 0 || toIndex >= t.rows.length) return t;
  return { ...t, rows: moveItem(t.rows, fromIndex, toIndex) };
}

export function addColumn(table, index = Infinity) {
  const t = normalizeTable(table);
  const insertIndex = clampInt(index, 0, t.columns.length);
  const newCol = { id: makeId("col"), label: "" };
  const nextColumns = relabelColumns(insertAt(t.columns, insertIndex, newCol));
  //add empty values to each row
  const nextRows = t.rows.map((r) => ({
    ...r,
    cells: insertAt(r.cells, insertIndex, ""),
  }));
  return { columns: nextColumns, rows: nextRows };
}

export function deleteColumn(table, index) {
  const t = normalizeTable(table);
  if (t.columns.length <= MIN_COLS) return t;
  if (index < 0 || index >= t.columns.length) return t;

  const nextColumns = relabelColumns(removeAt(t.columns, index));
  const nextRows = t.rows.map((r) => ({ ...r, cells: removeAt(r.cells, index) }));
  return { columns: nextColumns, rows: nextRows };
}

export function moveColumn(table, fromIndex, direction) {
  const t = normalizeTable(table); //{columns: [], rows: []}
  const toIndex = fromIndex + direction;
  if (fromIndex < 0 || fromIndex >= t.columns.length) return t;
  if (toIndex < 0 || toIndex >= t.columns.length) return t;

  const nextColumns = relabelColumns(moveItem(t.columns, fromIndex, toIndex));
  //
  const nextRows = t.rows.map((r) => ({
    ...r,
    cells: moveItem(r.cells, fromIndex, toIndex),
  }));
  return { columns: nextColumns, rows: nextRows };
}

export function moveColumnTo(table, fromIndex, toIndex) {
  const t = normalizeTable(table);
  if (fromIndex < 0 || fromIndex >= t.columns.length) return t;
  if (toIndex < 0 || toIndex >= t.columns.length) return t;

  const nextColumns = relabelColumns(moveItem(t.columns, fromIndex, toIndex));
  const nextRows = t.rows.map((r) => ({
    ...r,
    cells: moveItem(r.cells, fromIndex, toIndex),
  }));
  return { columns: nextColumns, rows: nextRows };
}

export function serializeTable(table) {
  return JSON.stringify(normalizeTable(table));
}

export function deserializeTable(payload) {
  if (typeof payload !== "string" || payload.trim() === "") return createTable();
  try {
    return normalizeTable(JSON.parse(payload));
  } catch {
    return createTable();
  }
}

