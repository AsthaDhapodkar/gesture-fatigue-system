// ─────────────────────────────────────────────
// CALC BUTTON
// Gesture-hover aware button with circular progress.
//
// Hover behaviour:
//  • Progress fills over `hoverDelay` ms.
//  • On completion → onSelect() fires.
//  • If pointer stays on button → cycle RESTARTS automatically.
//  • Cycle repeats as long as hover continues.
//  • Leaving the button cancels and resets progress.
//  • Jitter guard: a very brief leave (<JITTER_GRACE_MS) is ignored
//    so accidental micro-movements don't reset progress.
// ─────────────────────────────────────────────
import { useState, useRef, useCallback } from "react";

const JITTER_GRACE_MS = 120; // ignore leave events shorter than this

const VARIANT_STYLES = {
  number:   { bg: "var(--surface2)", color: "var(--text)",   border: "var(--border)"  },
  operator: { bg: "#1e1632",         color: "var(--accent)", border: "var(--accent)"  },
  action:   { bg: "#1e1620",         color: "var(--danger)", border: "var(--danger)"  },
  equals:   { bg: "var(--accent)",   color: "#fff",          border: "var(--accent)"  },
  special:  { bg: "#1a2620",         color: "var(--ok)",     border: "var(--ok)"      },
};

function CalcButton({ label, display, variant, onSelect, hoverDelay = 1500 }) {
  const [progress, setProgress]   = useState(0);   // 0 – 1
  const [isHovered, setIsHovered] = useState(false);

  // Refs — mutable, never cause re-renders
  const intervalRef   = useRef(null);  // rAF-based tick
  const startRef      = useRef(null);  // timestamp of cycle start
  const leaveTimerRef = useRef(null);  // jitter-grace debounce
  const hoveredRef    = useRef(false); // tracks real hover state

  const vs = VARIANT_STYLES[variant] || VARIANT_STYLES.number;

  // ── Start / restart a progress cycle ─────────
  const startCycle = useCallback(() => {
    clearInterval(intervalRef.current);
    startRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / hoverDelay, 1);
      setProgress(p);

      if (p >= 1) {
        // Cycle complete → fire selection
        clearInterval(intervalRef.current);
        onSelect(label);

        // If pointer is still hovering, restart cycle after a brief pause
        if (hoveredRef.current) {
          setTimeout(() => {
            if (hoveredRef.current) {
              setProgress(0);
              startCycle();
            }
          }, 80); // tiny pause so the user can see 100% before reset
        } else {
          setProgress(0);
        }
      }
    }, 16); // ~60 fps
  }, [hoverDelay, label, onSelect]);

  // ── Enter hover ───────────────────────────────
  const handleEnter = useCallback(() => {
    // Cancel any pending jitter-grace leave
    clearTimeout(leaveTimerRef.current);

    if (!hoveredRef.current) {
      hoveredRef.current = true;
      setIsHovered(true);
      setProgress(0);
      startCycle();
    }
  }, [startCycle]);

  // ── Leave hover (with jitter grace) ──────────
  const handleLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      // Only cancel if pointer truly left (not jitter)
      hoveredRef.current = false;
      setIsHovered(false);
      setProgress(0);
      clearInterval(intervalRef.current);
    }, JITTER_GRACE_MS);
  }, []);

  // ── Render ────────────────────────────────────
  // SVG circle: circumference of r=15 circle ≈ 94.25
  const CIRCUMFERENCE = 2 * Math.PI * 15; // ≈ 94.25

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 10,
        background: vs.bg,
        border: `1.5px solid ${isHovered ? vs.border : "var(--border)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "none",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.12s ease, box-shadow 0.12s ease, transform 0.1s ease",
        transform: isHovered ? "scale(1.04)" : "scale(1)",
        boxShadow: isHovered ? `0 0 14px ${vs.border}55` : "none",
        userSelect: "none",
      }}
    >
      {/* ── Vertical fill behind label ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: `${progress * 100}%`,
          background: `${vs.border}22`,
          pointerEvents: "none",
          transition: "height 0.016s linear",
        }}
      />

      {/* ── Circular sweep overlay ── */}
      <svg
        viewBox="0 0 36 36"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: isHovered ? 0.75 : 0,
          transition: "opacity 0.15s ease",
          pointerEvents: "none",
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <circle
          cx="18" cy="18" r="15"
          fill="none"
          stroke={vs.border}
          strokeWidth="1.8"
          strokeDasharray={`${progress * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset="0"
          transform="rotate(-90 18 18)"
          strokeLinecap="round"
        />
      </svg>

      {/* ── Label ── */}
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: variant === "equals" ? 22 : 18,
          fontWeight: 700,
          color: vs.color,
          position: "relative",
          zIndex: 1,
          lineHeight: 1,
          pointerEvents: "none",
        }}
      >
        {display || label}
      </span>
    </div>
  );
}

export default CalcButton;