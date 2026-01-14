import { useState, useRef } from "react";
import "./App.css";

import { SpreadsheetTable } from "./components/SpreadsheetTable";
import {
  addColumn,
  addRow,
  createTable,
  deleteColumn,
  deleteRow,
  deserializeTable,
  moveColumn,
  moveColumnTo,
  moveRow,
  moveRowTo,
  serializeTable,
  updateCell,
} from "./model/tableModel";
import { read, upload } from "./services/mockRemote";

const TABLE_ID = "main";

export default function App() {
  const [table, setTable] = useState(() => createTable({ rowCount: 5, colCount: 5 }));
  //maintained throughout = table
  // on change:
  // 1. update table
  //  Save
  //2. update table
  // Save
  const [status, setStatus] = useState("");
  const saveQueue = useRef(Promise.resolve());

  async function handleSave() {
    try {
      console.log("Saving...");
      await upload(TABLE_ID, serializeTable(table));
      console.log("Saved.");
      setStatus("Saved.");
    } catch (e) {
      setStatus(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function deleteAndSave(nextTable) {

    console.log("Deleting and saving...");
    setTable(nextTable);
    // setStatus("Saving...");
    // try {
    //   await upload(TABLE_ID, serializeTable(nextTable));
    //   console.log("Deleted and saved.");
    //   setStatus("Saved...");
    // } catch (e) {
    //   setStatus(`Delete and save failed: ${e instanceof Error ? e.message : String(e)}`);
    // }
    queueSave(nextTable);
  }

  function queueSave(nextTable) {
    saveQueue.current = saveQueue.current.then(() => {
      console.log("Saving in enQueue...");
      setStatus("Saving...");
      return upload(TABLE_ID, serializeTable(nextTable));
    }).then(() => {
      setStatus("Saved...");
    }).catch((e) => {
      setStatus(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    });
    return saveQueue.current;
  }


  async function handleLoad() {
    try {
      const payload = await read(TABLE_ID);
      if (!payload) {
        setStatus("Nothing saved yet.");
        return;
      }
      setTable(deserializeTable(payload));
      setStatus("Loaded.");
    } catch (e) {
      setStatus(`Load failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="app">
      <h2>TableBox</h2>

      <div className="toolbar">
        <button type="button" onClick={handleSave}>
          Save
        </button>
        <button type="button" onClick={handleLoad}>
          Load
        </button>
        <span className="status" aria-live="polite">
          {status}
        </span>
      </div>

      <SpreadsheetTable
        table={table}
        onAddRow={() => setTable((t) => addRow(t))}
        onAddColumn={() => setTable((t) => addColumn(t))}
        onMoveRow={(rowIndex, direction) =>
          setTable((t) => moveRow(t, rowIndex, direction))
        }
        onMoveRowTo={(fromIndex, toIndex) =>
          setTable((t) => moveRowTo(t, fromIndex, toIndex))
        }
        onDeleteRow={(rowIndex) => {
          const nextTable = deleteRow(table, rowIndex);
          deleteAndSave(nextTable);
        }}
        onMoveColumn={(colIndex, direction) =>
          setTable((t) => moveColumn(t, colIndex, direction))
        }
        onMoveColumnTo={(fromIndex, toIndex) =>
          setTable((t) => moveColumnTo(t, fromIndex, toIndex))
        }
        onDeleteColumn={(colIndex) => setTable((t) => deleteColumn(t, colIndex))}
        onCellChange={(rowIndex, colIndex, value) =>
          setTable((t) => updateCell(t, rowIndex, colIndex, value))
        }
      />
    </div>
  );
}
