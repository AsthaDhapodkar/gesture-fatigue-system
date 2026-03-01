// TodoItem.jsx — Reusable task row. Handles visual states + gesture hover.
//
// GESTURE CHANGES:
//  • Accepts gesture + onGestureHover props
//  • useRef + useEffect detects when gesture cursor overlaps this row
//  • Reports hover state up to Todo.jsx via onGestureHover(true/false)
//  • Pinch while gesture-hovered triggers onClick (handled in Todo.jsx)
//  • Gesture hover shown with distinct purple outline (vs mouse hover)
//  • Swipe simulation preserved for mouse fallback drag (left/right)

import React, { useRef, useEffect, useState } from 'react';

/**
 * @param {object} props
 * @param {object}   props.task              - Task object { id, text, completed, dragging }
 * @param {'pool'|'active'} props.variant    - Layout variant
 * @param {boolean}  props.isSelected        - Pool selection state
 * @param {boolean}  props.isDragOver        - Whether something is dragged over this row
 * @param {number}   props.heightMultiplier  - fatigueConfig.rowHeightMultiplier
 * @param {object}   props.gesture           - Global gesture state from AppContext
 * @param {function} props.onClick           - Pinch / click → toggle (active) or select (pool)
 * @param {function} props.onDragStart       - Grab gesture start
 * @param {function} props.onDragOver        - Grab gesture move over
 * @param {function} props.onDrop            - Drop onto this row
 * @param {function} props.onRightDrag       - Right drag → add to active (pool only)
 * @param {function} props.onLeftDrag        - Left drag → delete from pool (pool only)
 * @param {function} props.onGestureHover    - Called with true/false as gesture cursor enters/leaves
 */
export default function TodoItem({
  task,
  variant = 'active',
  isSelected = false,
  isDragOver = false,
  heightMultiplier = 1,
  gesture,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onRightDrag,
  onLeftDrag,
  onGestureHover,
}) {
  const rowRef = useRef(null);
  const dragStartX = useRef(null);

  // Local gesture hover state — drives visual highlight
  const [isGestureHovered, setIsGestureHovered] = useState(false);

  // ── Gesture cursor overlap detection ──────────────────────────────────
  // Runs every time gesture.position updates (every MediaPipe frame).
  // Maps normalized 0–1 position to screen pixels and checks against
  // this row's bounding rect.
  useEffect(() => {
    if (!gesture?.enabled || !rowRef.current) {
      // Gesture offline — clear hover state
      if (isGestureHovered) {
        setIsGestureHovered(false);
        onGestureHover?.(false);
      }
      return;
    }

    const rect = rowRef.current.getBoundingClientRect();
    const cx   = (gesture.position?.x ?? -1) * window.innerWidth;
    const cy   = (gesture.position?.y ?? -1) * window.innerHeight;

    const isOver =
      cx >= rect.left  &&
      cx <= rect.right &&
      cy >= rect.top   &&
      cy <= rect.bottom;

    // Only fire callback when state actually changes (avoid thrashing)
    if (isOver !== isGestureHovered) {
      setIsGestureHovered(isOver);
      onGestureHover?.(isOver);
    }
  }, [gesture?.position, gesture?.enabled]);

  // ── Cleanup: report hover=false when unmounting ────────────────────
  useEffect(() => {
    return () => onGestureHover?.(false);
  }, []);

  // ── Height from fatigue multiplier (unchanged) ─────────────────────
  const baseHeight   = variant === 'pool' ? 52 : 60;
  const scaledHeight = Math.round(baseHeight * heightMultiplier);

  // ── Class list (unchanged base classes + gesture hover) ───────────
  const classNames = [
    'task-row',
    `task-row--${variant}`,
    task.completed  ? 'task-completed'      : '',
    task.dragging   ? 'task-dragging'       : '',
    isSelected      ? 'is-selected'         : '',
    isDragOver      ? 'task-row--drag-over' : '',
    isGestureHovered ? 'task-row--gesture-hover' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // ── Mouse drag simulation (unchanged — fallback when no camera) ────
  function handleMouseDown(e) {
    dragStartX.current = e.clientX;
  }

  function handleMouseUp(e) {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;

    if (Math.abs(delta) < 8) return; // too small — treat as click

    if (variant === 'pool') {
      if (delta > 0) onRightDrag?.(task);
      else           onLeftDrag?.(task);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={rowRef}
      className={classNames}
      style={{
        height: scaledHeight,
        // Gesture hover: purple outline, distinct from mouse :hover in CSS
        outline: isGestureHovered
          ? '2px solid rgba(124, 58, 237, 0.7)'
          : 'none',
        outlineOffset: '-2px',
        // Slight scale-up when gesture cursor is over this row
        transform: isGestureHovered ? 'scaleX(1.01)' : 'scaleX(1)',
        transformOrigin: 'left center',
        transition: 'transform 0.1s ease, outline 0.1s ease',
        // Show grab cursor when in fist mode hovering this row
        cursor: isGestureHovered && gesture?.mode === 'grab' ? 'grabbing' : undefined,
      }}
      draggable={variant === 'active'}
      onClick={() => onClick?.(task)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDragStart={() => onDragStart?.(task)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(task); }}
      onDrop={() => onDrop?.(task)}
    >
      <span>{task.text}</span>

      {/* Gesture hover indicator — shown only when gesture cursor is over row */}
      {isGestureHovered && (
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--mono)',
          fontSize: 9,
          letterSpacing: '0.1em',
          color: 'rgba(124, 58, 237, 0.6)',
          flexShrink: 0,
          paddingLeft: 8,
        }}>
          {gesture?.mode === 'grab'  ? 'GRAB'
            : variant === 'active'  ? 'PINCH TO DONE'
            : 'PINCH TO SELECT'}
        </span>
      )}
    </div>
  );
}