import React, { useRef, useState } from "react";

export function SpreadsheetTable({
  table,
  onAddRow,
  onAddColumn,
  onMoveRow,
  onMoveRowTo,
  onDeleteRow,
  onMoveColumn,
  onMoveColumnTo,
  onDeleteColumn,
  onCellChange,
}) {
  const columns = table.columns;
  const rows = table.rows;
  const dragRowFromRef = useRef(null);
  const dragColFromRef = useRef(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState(null);
  const [dragOverColIndex, setDragOverColIndex] = useState(null);

  const hasRowDnd = typeof onMoveRowTo === "function";
  const hasColDnd = typeof onMoveColumnTo === "function";

  function handleRowDragStart(e, rowIndex) {
    if (!hasRowDnd) return;
    dragRowFromRef.current = rowIndex;
    e.dataTransfer.effectAllowed = "move";
    // Safari sometimes requires some data to be set.
    e.dataTransfer.setData("text/plain", String(rowIndex));
  }

  function handleRowDragOver(e, rowIndex) {
    if (!hasRowDnd) return;
    e.preventDefault();
    if (dragOverRowIndex !== rowIndex) setDragOverRowIndex(rowIndex);
  }

  function handleRowDrop(e, rowIndex) {
    if (!hasRowDnd) return;
    e.preventDefault();
    const from = dragRowFromRef.current;
    dragRowFromRef.current = null;
    setDragOverRowIndex(null);
    if (typeof from !== "number") return;
    if (from === rowIndex) return;
    onMoveRowTo(from, rowIndex);
  }

  function handleRowDragEnd() {
    dragRowFromRef.current = null;
    setDragOverRowIndex(null);
  }

  function handleColDragStart(e, colIndex) {
    if (!hasColDnd) return;
    dragColFromRef.current = colIndex;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(colIndex));
  }

  function handleColDragOver(e, colIndex) {
    if (!hasColDnd) return;
    e.preventDefault();
    if (dragOverColIndex !== colIndex) setDragOverColIndex(colIndex);
  }

  function handleColDrop(e, colIndex) {
    if (!hasColDnd) return;
    e.preventDefault();
    const from = dragColFromRef.current;
    dragColFromRef.current = null;
    setDragOverColIndex(null);
    if (typeof from !== "number") return;
    if (from === colIndex) return;
    onMoveColumnTo(from, colIndex);
  }

  function handleColDragEnd() {
    dragColFromRef.current = null;
    setDragOverColIndex(null);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={onAddRow}>
          Add Row
        </button>
        <button type="button" onClick={onAddColumn}>
          Add Column
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th />
            {columns.map((c, colIndex) => (
              <th
                key={c.id}
                onDragOver={(e) => handleColDragOver(e, colIndex)}
                onDrop={(e) => handleColDrop(e, colIndex)}
                style={
                  dragOverColIndex === colIndex
                    ? { outline: "2px solid #999" }
                    : undefined
                }
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span
                    draggable={hasColDnd}
                    onDragStart={(e) => handleColDragStart(e, colIndex)}
                    onDragEnd={handleColDragEnd}
                    title={hasColDnd ? "Drag to reorder columns" : undefined}
                    style={{
                      cursor: hasColDnd ? "grab" : "default",
                      userSelect: "none",
                    }}
                  >
                    ⠿
                  </span>
                  <span>{c.label}</span>
                  <button
                    type="button"
                    onClick={() => onMoveColumn(colIndex, -1)}
                    disabled={colIndex === 0}
                    title="Move column left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveColumn(colIndex, 1)}
                    disabled={colIndex === columns.length - 1}
                    title="Move column right"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteColumn(colIndex)}
                    disabled={columns.length <= 1}
                    title="Delete column"
                  >
                    Delete
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, rowIndex) => (
            <tr
              key={r.id}
              onDragOver={(e) => handleRowDragOver(e, rowIndex)}
              onDrop={(e) => handleRowDrop(e, rowIndex)}
              style={
                dragOverRowIndex === rowIndex
                  ? { outline: "2px solid #999" }
                  : undefined
              }
            >
              <td>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span
                    draggable={hasRowDnd}
                    onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                    onDragEnd={handleRowDragEnd}
                    title={hasRowDnd ? "Drag to reorder rows" : undefined}
                    style={{
                      cursor: hasRowDnd ? "grab" : "default",
                      userSelect: "none",
                    }}
                  >
                    ⠿
                  </span>
                  <button
                    type="button"
                    onClick={() => onMoveRow(rowIndex, -1)}
                    disabled={rowIndex === 0}
                    title="Move row up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveRow(rowIndex, 1)}
                    disabled={rowIndex === rows.length - 1}
                    title="Move row down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRow(rowIndex)}
                    disabled={rows.length <= 1}
                    title="Delete row"
                  >
                    Delete
                  </button>
                </div>
              </td>

              {columns.map((c, colIndex) => (
                <td key={c.id}>
                  <input
                    value={r.cells[colIndex] ?? ""}
                    onChange={(e) =>
                      onCellChange(rowIndex, colIndex, e.target.value)
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

