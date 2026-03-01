// Todo.jsx — Main integration layer.
// Combines pool + active list, manages state, connects fatigueConfig.
//
// GESTURE CHANGES:
//  • gesture.pinch  → toggle complete on hovered active task
//                   → select/deselect hovered pool task
//  • gesture.swipe right → add selected pool task to active list
//  • gesture.swipe left  → delete selected pool task from pool
//  • gesture.fist   → enters grab/drag mode (visual feedback only —
//                     actual reorder still uses HTML drag API as fallback)
//  • gesture.mode === "palm" → drives hover detection over task rows
//  • Keyboard keys are gesture-hoverable + pinch-clickable
//  • fatigueConfig pulled from AppContext (no longer a prop)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import TodoItem from './TodoItem';
import {
  createTask,
  deleteTaskFromPool,
  addTaskToActive,
  removeTaskFromActive,
  toggleComplete,
  reorderTasks,
} from './todoLogic';
import './todo.css';

// ─────────────────────────────────────────────
// useGestureHover
// Returns true when gesture cursor overlaps a given ref element.
// ─────────────────────────────────────────────
function useGestureHover(ref, gesture) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!gesture?.enabled || !ref?.current) { setHovered(false); return; }
    const rect = ref.current.getBoundingClientRect();
    const cx = (gesture.position?.x ?? -1) * window.innerWidth;
    const cy = (gesture.position?.y ?? -1) * window.innerHeight;
    setHovered(cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom);
  }, [gesture?.position, gesture?.enabled]);

  return hovered;
}

// ─── Keyboard Layout ───────────────────────────────────────────────────────
const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

// ─── Seed Data ─────────────────────────────────────────────────────────────
const INITIAL_POOL = [
  createTask('Review ML pipeline'),
  createTask('Update fatigue model'),
  createTask('Write gesture docs'),
  createTask('Deploy new build'),
];

// ─────────────────────────────────────────────
// GestureKeyboardKey — single key that reacts to gesture hover + pinch
// ─────────────────────────────────────────────
function GestureKeyboardKey({ char, display, onClick, style, className, gesture }) {
  const ref = useRef(null);
  const isGestureHovered = useGestureHover(ref, gesture);

  // Pinch while gesture hovering → trigger key
  useEffect(() => {
    if (isGestureHovered && gesture?.pinch) {
      onClick?.();
    }
  }, [gesture?.pinch, isGestureHovered]);

  return (
    <button
      ref={ref}
      className={className}
      style={{
        ...style,
        // Gesture hover highlight — distinct from mouse hover
        outline: isGestureHovered ? '2px solid #9b6dff' : undefined,
        outlineOffset: isGestureHovered ? '1px' : undefined,
        transform: isGestureHovered ? 'scale(1.12)' : 'scale(1)',
        boxShadow: isGestureHovered ? '0 0 8px #9b6dff66' : undefined,
        transition: 'transform 0.1s, box-shadow 0.1s',
        position: 'relative',
        zIndex: isGestureHovered ? 2 : undefined,
      }}
      onClick={onClick}
    >
      {display}
    </button>
  );
}

// ─────────────────────────────────────────────
// Main Todo component
// ─────────────────────────────────────────────
export default function Todo() {
  // Pull gesture AND fatigue from AppContext
  const { gesture, fatigue } = useApp();

  // Map fatigue level to numeric multiplier (matches your original logic)
  const fatigueLevelMap = { Low: 1, Medium: 1.2, High: 1.4 };
  const fatigueLevel = fatigueLevelMap[fatigue?.level] ?? 1;

  // Derive config values from AppContext fatigue (replaces defaultFatigueConfig prop)
  const config = {
    hoverDelay:          fatigue?.hoverDelay          ?? 120,
    rowHeightMultiplier: fatigue?.buttonScaleMultiplier ?? 1,
    swipeThreshold:      40,
    jitterTolerance:     fatigue?.jitterTolerance      ?? 6,
  };

  const heightMult = config.rowHeightMultiplier * fatigueLevel;

  // ── Core state ────────────────────────────
  const [inputText, setInputText]       = useState('');
  const [taskPool, setTaskPool]         = useState(INITIAL_POOL);
  const [activeList, setActive]         = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [draggingTask, setDraggingTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [dustbinActive, setDustbinActive] = useState(false);
  const [isCaps, setIsCaps]             = useState(false);

  // Track which task the gesture cursor is hovering over
  // These are set by TodoItem via onGestureHover callback
  const [gestureHoveredPool, setGestureHoveredPool]     = useState(null);
  const [gestureHoveredActive, setGestureHoveredActive] = useState(null);

  // ── Virtual Keyboard ──────────────────────
  const commitTask = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setTaskPool(pool => [createTask(trimmed), ...pool]);
    setInputText('');
  }, [inputText]);

  const handleKey = useCallback((action, char) => {
    if (action === 'char')      setInputText(t => t + char);
    else if (action === 'backspace') setInputText(t => t.slice(0, -1));
    else if (action === 'space')    setInputText(t => t + ' ');
    else if (action === 'caps')     setIsCaps(c => !c);
    else if (action === 'enter')    commitTask();
  }, [commitTask]);

  // ── Task interaction handlers ─────────────

  // PINCH on active task → toggle complete
  const handleActiveClick = useCallback((task) => {
    setActive(list => toggleComplete(list, task.id));
  }, []);

  // PINCH on pool task → select/deselect
  const handlePoolClick = useCallback((task) => {
    setSelectedPool(sel => sel?.id === task.id ? null : task);
  }, []);

  const handleRightDrag = useCallback((task) => {
    setActive(list => addTaskToActive(list, task));
  }, []);

  const handleLeftDrag = useCallback((task) => {
    setTaskPool(pool => deleteTaskFromPool(pool, task.id));
    setSelectedPool(sel => sel?.id === task.id ? null : sel);
  }, []);

  const handleDragStart = useCallback((task) => setDraggingTask(task), []);

  const handleDragOver = useCallback((task) => {
    setDragOverTask(task);
    setDustbinActive(task === null);
  }, []);

  const handleDrop = useCallback((targetTask) => {
    if (!draggingTask || !targetTask || draggingTask.id === targetTask.id) return;
    setActive(list => {
      const fromIdx = list.findIndex(t => t.id === draggingTask.id);
      const toIdx   = list.findIndex(t => t.id === targetTask.id);
      return reorderTasks(list, fromIdx, toIdx);
    });
    setDraggingTask(null);
    setDragOverTask(null);
  }, [draggingTask]);

  const handleDustbinDrop = useCallback(() => {
    if (!draggingTask) return;
    setActive(list => removeTaskFromActive(list, draggingTask.id));
    setDraggingTask(null);
    setDustbinActive(false);
  }, [draggingTask]);

  const handleDragEnd = useCallback(() => {
    setDraggingTask(null);
    setDragOverTask(null);
    setDustbinActive(false);
  }, []);

  // ── GESTURE REACTIONS ─────────────────────────────────────────────────────

  // PINCH → act on whichever task the gesture cursor is hovering
  useEffect(() => {
    if (!gesture?.pinch) return;

    // Active list: pinch on hovered active task → toggle complete
    if (gestureHoveredActive) {
      handleActiveClick(gestureHoveredActive);
      return;
    }

    // Pool: pinch on hovered pool task → select/deselect
    if (gestureHoveredPool) {
      handlePoolClick(gestureHoveredPool);
    }
  }, [gesture?.pinch]);
  // NOTE: intentionally omitting handlers from deps — they're stable useCallbacks
  // and we don't want this to re-run on every render.

  // SWIPE RIGHT → add currently selected pool task to active list
  useEffect(() => {
    if (gesture?.swipe !== 'right') return;
    if (!selectedPool) return;
    setActive(list => addTaskToActive(list, selectedPool));
    setSelectedPool(null); // deselect after adding
  }, [gesture?.swipe]);

  // SWIPE LEFT → delete currently selected pool task from pool
  useEffect(() => {
    if (gesture?.swipe !== 'left') return;
    if (!selectedPool) return;
    setTaskPool(pool => deleteTaskFromPool(pool, selectedPool.id));
    setSelectedPool(null);
  }, [gesture?.swipe]);

  // FIST mode → visual grab feedback (actual reorder via HTML drag API)
  // When fist is detected while hovering an active task, mark it as dragging
  useEffect(() => {
    if (gesture?.mode === 'grab' && gestureHoveredActive && !draggingTask) {
      setDraggingTask(gestureHoveredActive);
    } else if (gesture?.mode !== 'grab' && draggingTask) {
      // Fist released — if there's a drag target, complete the reorder
      if (dragOverTask) {
        handleDrop(dragOverTask);
      } else {
        handleDragEnd();
      }
    }
  }, [gesture?.mode]);

  // ── Swipe hint flash state ─────────────────
  const [swipeFlash, setSwipeFlash] = useState(null); // "left" | "right" | null
  useEffect(() => {
    if (!gesture?.swipe) return;
    setSwipeFlash(gesture.swipe);
    const t = setTimeout(() => setSwipeFlash(null), 700);
    return () => clearTimeout(t);
  }, [gesture?.swipe]);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="todo-container">

      {/* ── Gesture status bar ───────────────────────────────────────────── */}
      {gesture?.enabled && (
        <div style={{
          position: 'absolute', top: 8, right: 16,
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2,
          color: 'var(--text-dim)',
          zIndex: 10,
        }}>
          {/* Swipe hint */}
          {swipeFlash && (
            <span style={{
              color: '#ffcc44',
              animation: 'fadeIn 0.2s ease both',
            }}>
              {swipeFlash === 'left' ? '← SWIPE: DELETE' : 'SWIPE →: ADD'}
            </span>
          )}
          {/* Selected pool task hint */}
          {selectedPool && (
            <span style={{ color: '#9b6dff' }}>
              SELECTED: {selectedPool.text.slice(0, 16)}…
            </span>
          )}
          {/* Mode dot */}
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: gesture.mode === 'palm' ? '#9b6dff'
              : gesture.mode === 'grab' ? '#0ea5e9'
              : 'rgba(255,255,255,0.15)',
            boxShadow: gesture.mode !== 'idle' ? '0 0 6px currentColor' : 'none',
          }} />
          <span>{gesture.mode.toUpperCase()}</span>
        </div>
      )}

      {/* ── LEFT: Task Pool ─────────────────────────────────────────────── */}
      <div className="todo-section" style={{ position: 'relative' }}>
        <div className="section-header">
          <h2 className="todo-title" style={{ margin: 0 }}>Task Pool</h2>
          <span className="task-count">{taskPool.length}</span>
        </div>
        <div style={{ height: 10 }} />

        {/* Text input */}
        <input
          className="todo-input"
          type="text"
          placeholder="Type a task..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitTask(); }}
        />

        {/* Virtual Keyboard — each key is gesture-hoverable + pinch-clickable */}
        <div className="keyboard-grid">
          {KEYBOARD_ROWS.flat().map(char => {
            const display = isCaps ? char : char.toLowerCase();
            const output  = isCaps ? char : char.toLowerCase();
            return (
              <GestureKeyboardKey
                key={char}
                char={char}
                display={display}
                className="keyboard-key"
                gesture={gesture}
                onClick={() => handleKey('char', output)}
              />
            );
          })}

          {/* Action keys */}
          <GestureKeyboardKey
            char="CAPS"
            display={isCaps ? '⇪ CAPS' : '⇪ caps'}
            className={`keyboard-key keyboard-key--action${isCaps ? ' keyboard-key--caps-on' : ''}`}
            style={{ gridColumn: 'span 2' }}
            gesture={gesture}
            onClick={() => handleKey('caps', '')}
          />
          <GestureKeyboardKey
            char="BACKSPACE"
            display="⌫"
            className="keyboard-key keyboard-key--action"
            style={{ gridColumn: 'span 2' }}
            gesture={gesture}
            onClick={() => handleKey('backspace', '')}
          />
          <GestureKeyboardKey
            char="SPACE"
            display="SPACE"
            className="keyboard-key keyboard-key--action"
            style={{ gridColumn: 'span 3' }}
            gesture={gesture}
            onClick={() => handleKey('space', '')}
          />
          <GestureKeyboardKey
            char="ENTER"
            display="↵ ADD"
            className="keyboard-key keyboard-key--action"
            style={{ gridColumn: 'span 3' }}
            gesture={gesture}
            onClick={() => handleKey('enter', '')}
          />
        </div>

        {/* Pool List */}
        <div className="task-pool-list">
          {taskPool.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              No tasks in pool
            </div>
          )}
          {taskPool.map(task => (
            <TodoItem
              key={task.id}
              task={task}
              variant="pool"
              isSelected={selectedPool?.id === task.id}
              isDragOver={false}
              heightMultiplier={heightMult}
              gesture={gesture}
              onClick={handlePoolClick}
              onRightDrag={handleRightDrag}
              onLeftDrag={handleLeftDrag}
              // Callback so TodoItem can tell us when gesture cursor enters/leaves it
              onGestureHover={hovered =>
                setGestureHoveredPool(hovered ? task : null)
              }
            />
          ))}
        </div>

        <p className="gesture-hint">
          ← swipe to delete · → swipe to activate · pinch to select
        </p>
      </div>

      {/* ── RIGHT: Active To-Do List ─────────────────────────────────────── */}
      <div className="todo-section" style={{ position: 'relative' }}>
        <div className="section-header">
          <h2 className="todo-title" style={{ margin: 0 }}>Active Tasks</h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="task-count">{activeList.length}</span>
            {/* Fatigue level display — now read-only, driven by AppContext */}
            <span style={{
              height: 24, padding: '0 10px',
              fontSize: 10, borderRadius: 20,
              display: 'flex', alignItems: 'center',
              fontFamily: 'var(--mono)',
              background: fatigue?.level === 'High'
                ? 'rgba(247,106,106,0.15)'
                : fatigue?.level === 'Medium'
                ? 'rgba(247,217,106,0.15)'
                : 'rgba(106,247,180,0.15)',
              color: fatigue?.level === 'High' ? '#f76a6a'
                : fatigue?.level === 'Medium' ? '#f7d96a'
                : '#6af7b4',
              border: '1px solid currentColor',
              letterSpacing: 1,
            }}>
              {fatigue?.level === 'High' ? '⚡ HI-FATIGUE'
                : fatigue?.level === 'Medium' ? '⚡ MED-FATIGUE'
                : '😌 NORMAL'}
            </span>
          </div>
        </div>
        <div style={{ height: 10 }} />

        <div
          className="active-task-list"
          onDragOver={e => { e.preventDefault(); setDustbinActive(false); }}
        >
          {activeList.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">→</span>
              Swipe right on a pool task to add
            </div>
          )}
          {activeList.map(task => (
            <TodoItem
              key={task.id}
              task={{ ...task, dragging: draggingTask?.id === task.id }}
              variant="active"
              isDragOver={dragOverTask?.id === task.id}
              heightMultiplier={heightMult}
              gesture={gesture}
              onClick={handleActiveClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              // Callback so we know which active task the gesture cursor is over
              onGestureHover={hovered =>
                setGestureHoveredActive(hovered ? task : null)
              }
            />
          ))}
        </div>

        {/* Dustbin */}
        <div
          className={`dustbin${dustbinActive ? ' dustbin--active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDustbinActive(true); handleDragOver(null); }}
          onDrop={handleDustbinDrop}
          onDragLeave={() => setDustbinActive(false)}
          onDragEnd={handleDragEnd}
        >
          <span className="dustbin-icon">🗑</span>
          {dustbinActive ? 'DROP TO DELETE' : 'DRAG HERE TO REMOVE'}
        </div>

        <p className="gesture-hint">
          pinch to complete · fist + move to reorder · drop on bin to remove
        </p>
      </div>
    </div>
  );
}