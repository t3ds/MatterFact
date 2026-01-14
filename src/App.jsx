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
const MAX_HISTORY = 10;

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
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  //push current state into undo stack, clear redo stack.
  // This is called for all functions to store the current state into the stack before the change is made.
  // All of this could be tied into the autosave as well by calling the autosave function after this in place of setTable at the end when passing the props to SpreadsheetTable.
  function handleChange(nextTable) {
    undoStackRef.current.push(serializeTable(nextTable));
    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current = undoStackRef.current.slice(-MAX_HISTORY);
    }
    redoStackRef.current = []; //clear redo stack on new change
  }

  //undo: pop from stack, push current state into redo stack, set table to previous state
  function handleUndo() {
    if (undoStackRef.current.length === 0) return;
    const prevTable = undoStackRef.current.pop();
    redoStackRef.current.push(serializeTable(table));
    setTable(deserializeTable(prevTable));
  }

  //redo: pop from redo stack, push current state into undo stack, set table to next state
  function handleRedo() {
    if (redoStackRef.current.length === 0) return;
    const nextTable = redoStackRef.current.pop();
    undoStackRef.current.push(serializeTable(table));
    setTable(deserializeTable(nextTable));
  }

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
        <button type="button" onClick={handleUndo} disabled={undoStackRef.current.length === 0}>Undo</button>
        <button type="button" onClick={handleRedo} disabled={redoStackRef.current.length === 0}>Redo</button>
        <span className="status" aria-live="polite">
          {status}
        </span>
      </div>

      <SpreadsheetTable
        table={table}
        onAddRow={() => {
          handleChange(table);
          setTable((t)=>addRow(t))
        }}
        onAddColumn={() => {
          handleChange(table);
          setTable((t)=>addColumn(t))
        }}
        onMoveRow={(rowIndex, direction) =>
          {
            handleChange(table);
            setTable((t)=>moveRow(t, rowIndex, direction))
          }
        }
        onMoveRowTo={(fromIndex, toIndex) =>
          {
            handleChange(table);
            setTable((t)=>moveRowTo(t, fromIndex, toIndex))
          }
        }
        onDeleteRow={(rowIndex) => {
          handleChange(table);
          const nextTable = deleteRow(table, rowIndex);
          deleteAndSave(nextTable);
        }}
        onMoveColumn={(colIndex, direction) =>
          {
            handleChange(table);
            setTable((t)=>moveColumn(t, colIndex, direction))
          }
        }
        onMoveColumnTo={(fromIndex, toIndex) =>
          {
            handleChange(table);
            setTable((t)=>moveColumnTo(t, fromIndex, toIndex))
          }
        }
        onDeleteColumn={(colIndex) => {
          handleChange(table);
          setTable((t)=>deleteColumn(t, colIndex))
        }}
        onCellChange={(rowIndex, colIndex, value) =>
          {
            handleChange(table);
            setTable((t)=>updateCell(t, rowIndex, colIndex, value))
          }
        }
      />
    </div>
  );
}
