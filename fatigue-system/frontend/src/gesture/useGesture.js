/**
 * useGesture.js
 * Convenience hook for UI modules to read gesture state.
 *
 * Usage:
 *   const { mode, position, pinch, swipe } = useGesture();
 *
 * This is the ONLY way modules should access gesture data.
 * Modules must NOT import GestureEngine or gestureDetection directly.
 */

import { useEffect, useRef } from "react";
import { useAppContext } from "../context/AppContext";

// ─────────────────────────────────────────────
// useGesture — read current gesture state
// ─────────────────────────────────────────────
export function useGesture() {
  const { gesture } = useAppContext();
  return gesture;
}

// ─────────────────────────────────────────────
// useOnPinch — fire a callback ONCE per pinch gesture
// Handles the rising-edge pattern automatically.
//
// @param callback  function to call when pinch occurs
// @param enabled   optionally disable the hook
// ─────────────────────────────────────────────
export function useOnPinch(callback, enabled = true) {
  const { gesture } = useAppContext();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (enabled && gesture.pinch) {
      callbackRef.current();
    }
  }, [gesture.pinch, enabled]);
}

// ─────────────────────────────────────────────
// useOnSwipe — fire a callback when a swipe is detected
//
// @param callback  function(direction: "left"|"right") => void
// @param enabled   optionally disable
// ─────────────────────────────────────────────
export function useOnSwipe(callback, enabled = true) {
  const { gesture } = useAppContext();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (enabled && gesture.swipe) {
      callbackRef.current(gesture.swipe);
    }
  }, [gesture.swipe, enabled]);
}

// ─────────────────────────────────────────────
// useGestureFocus — returns whether gesture cursor
// is hovering over a given element ref
//
// @param elementRef  React ref to the DOM element
// @returns boolean
// ─────────────────────────────────────────────
export function useGestureFocus(elementRef) {
  const { gesture } = useAppContext();

  if (!elementRef.current || !gesture.enabled) return false;

  const rect = elementRef.current.getBoundingClientRect();
  const cursorX = gesture.position.x * window.innerWidth;
  const cursorY = gesture.position.y * window.innerHeight;

  return (
    cursorX >= rect.left &&
    cursorX <= rect.right &&
    cursorY >= rect.top &&
    cursorY <= rect.bottom
  );
}