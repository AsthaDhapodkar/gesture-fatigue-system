// ─────────────────────────────────────────────
// FATIGUE ENGINE
// Monitors real gesture data to detect hand fatigue.
// Renders nothing — pure background analysis.
//
// Detection signals:
//  1. JITTER    — high variance in palm position between frames
//                 (shaky/trembling hand = fatigue)
//  2. VELOCITY  — palm movement speed dropping over time
//                 (slower gestures = tiredness)
//  3. DURATION  — continuous active gesture time
//                 (long sessions without rest)
//  4. PINCH RATE — pinch frequency over a rolling window
//                 (frequent pinching strains fingers)
//
// Fatigue level escalates: Low → Medium → High
// In "automatic" mode: driven by signals above.
// In "manual" mode (user toggled via Sidebar): engine pauses.
//
// Writes to AppContext via setFatigue — nothing else does.
// ─────────────────────────────────────────────
import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";

// ─── Tuning constants ─────────────────────────────────────────────────────────

// How many recent position frames to keep for jitter analysis
const JITTER_WINDOW = 20;

// Variance threshold above which jitter is flagged (normalized coords)
const JITTER_LOW_THRESHOLD    = 0.0004; // Low → Medium
const JITTER_HIGH_THRESHOLD   = 0.0012; // Medium → High

// Continuous active gesture time (ms) before escalating fatigue
const DURATION_MEDIUM_MS = 60_000;  // 1 min  → Medium
const DURATION_HIGH_MS   = 180_000; // 3 min  → High

// Pinch count thresholds within a rolling PINCH_WINDOW_MS window
const PINCH_WINDOW_MS    = 30_000;  // 30 second rolling window
const PINCH_MEDIUM_COUNT = 15;      // 15 pinches → Medium
const PINCH_HIGH_COUNT   = 35;      // 35 pinches → High

// How often the engine runs its analysis (ms)
const ANALYSIS_INTERVAL_MS = 2_000;

// Fatigue level configs (mirrors AppContext defaults)
const FATIGUE_CONFIGS = {
  Low:    { buttonScaleMultiplier: 1,    hoverDelay: 700, jitterTolerance: 8,  cursorSnapStrength: 0.3 },
  Medium: { buttonScaleMultiplier: 1.15, hoverDelay: 550, jitterTolerance: 14, cursorSnapStrength: 0.5 },
  High:   { buttonScaleMultiplier: 1.30, hoverDelay: 400, jitterTolerance: 20, cursorSnapStrength: 0.7 },
};

// ─── Utility: compute variance of an array of numbers ────────────────────────
function variance(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
}

// ─────────────────────────────────────────────
// FatigueEngine
// ─────────────────────────────────────────────
function FatigueEngine() {
  const { gesture, fatigue, setFatigue } = useApp();

  // ── Rolling buffers ────────────────────────
  // Recent palm X positions (for jitter)
  const posXHistory = useRef([]);
  const posYHistory = useRef([]);

  // Timestamp when continuous gesture activity started (null = not active)
  const activeStartRef = useRef(null);
  // Accumulated active ms from previous sessions
  const totalActiveMsRef = useRef(0);

  // Pinch timestamps for rolling-window rate analysis
  const pinchTimestamps = useRef([]);

  // Last known gesture mode to detect transitions
  const prevModeRef = useRef("idle");

  // ── Track palm position history ────────────────────────────────────────
  useEffect(() => {
    if (!gesture?.enabled) return;

    const { x, y } = gesture.position ?? { x: 0.5, y: 0.5 };

    // Only record when hand is actively moving (palm or grab mode)
    if (gesture.mode === "palm" || gesture.mode === "grab") {
      posXHistory.current.push(x);
      posYHistory.current.push(y);

      // Keep buffer trimmed
      if (posXHistory.current.length > JITTER_WINDOW) posXHistory.current.shift();
      if (posYHistory.current.length > JITTER_WINDOW) posYHistory.current.shift();
    }
  }, [gesture?.position]);

  // ── Track continuous active time ───────────────────────────────────────
  useEffect(() => {
    if (!gesture?.enabled) return;

    const isActive = gesture.mode === "palm" || gesture.mode === "grab";
    const wasActive = prevModeRef.current === "palm" || prevModeRef.current === "grab";

    if (isActive && !wasActive) {
      // Gesture became active — start timer
      activeStartRef.current = Date.now();
    } else if (!isActive && wasActive && activeStartRef.current !== null) {
      // Gesture went idle — accumulate elapsed time
      totalActiveMsRef.current += Date.now() - activeStartRef.current;
      activeStartRef.current = null;
    }

    prevModeRef.current = gesture.mode;
  }, [gesture?.mode]);

  // ── Track pinch events ─────────────────────────────────────────────────
  // gesture.pinch is true for exactly ONE frame (rising edge from GestureEngine)
  useEffect(() => {
    if (!gesture?.pinch) return;
    pinchTimestamps.current.push(Date.now());
  }, [gesture?.pinch]);

  // ── Periodic fatigue analysis ──────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      // Skip if user has taken manual control
      if (fatigue.mode === "manual") return;
      if (!gesture?.enabled) return;

      const now = Date.now();

      // ── Signal 1: Jitter ─────────────────────────────────────────────
      const jitterX = variance(posXHistory.current);
      const jitterY = variance(posYHistory.current);
      const jitter  = jitterX + jitterY; // combined 2D jitter

      // ── Signal 2: Active duration ────────────────────────────────────
      const currentSessionMs = activeStartRef.current
        ? now - activeStartRef.current
        : 0;
      const totalActiveMs = totalActiveMsRef.current + currentSessionMs;

      // ── Signal 3: Pinch rate ─────────────────────────────────────────
      // Trim old pinch timestamps outside the rolling window
      pinchTimestamps.current = pinchTimestamps.current.filter(
        ts => now - ts <= PINCH_WINDOW_MS
      );
      const recentPinches = pinchTimestamps.current.length;

      // ── Determine target fatigue level ───────────────────────────────
      // Any signal at the highest threshold → High
      // Any signal at medium threshold → Medium
      // Otherwise → Low
      let targetLevel = "Low";

      if (
        jitter        >= JITTER_HIGH_THRESHOLD   ||
        totalActiveMs >= DURATION_HIGH_MS         ||
        recentPinches >= PINCH_HIGH_COUNT
      ) {
        targetLevel = "High";
      } else if (
        jitter        >= JITTER_LOW_THRESHOLD     ||
        totalActiveMs >= DURATION_MEDIUM_MS       ||
        recentPinches >= PINCH_MEDIUM_COUNT
      ) {
        targetLevel = "Medium";
      }

      // ── Apply if changed ──────────────────────────────────────────────
      if (targetLevel !== fatigue.level) {
        setFatigue(f => ({
          ...f,
          level: targetLevel,
          ...FATIGUE_CONFIGS[targetLevel],
        }));
      }
    }, ANALYSIS_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fatigue.mode, fatigue.level, gesture?.enabled, setFatigue]);

  // ── Reset buffers when gesture goes offline ────────────────────────────
  useEffect(() => {
    if (!gesture?.enabled) {
      posXHistory.current    = [];
      posYHistory.current    = [];
      activeStartRef.current = null;
      totalActiveMsRef.current = 0;
      pinchTimestamps.current  = [];
    }
  }, [gesture?.enabled]);

  // Renders nothing — pure background engine
  return null;
}

export default FatigueEngine;