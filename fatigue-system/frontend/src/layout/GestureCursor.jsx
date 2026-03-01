// ─────────────────────────────────────────────
// GESTURE CURSOR
// Reads from gesture.position (normalized 0–1)
// and reflects gesture.mode visually.
//
// Modes:
//   idle  → hidden (opacity 0)
//   palm  → open ring cursor (navigate)
//   grab  → filled dot cursor (drag)
//   pinch → pulse ring (confirm)
// ─────────────────────────────────────────────
import { useApp } from "../context/AppContext";

function GestureCursor() {
  const { gesture, fatigue } = useApp();

  // Don't render anything if gesture system is offline
  if (!gesture?.enabled) return null;

  // Fatigue level drives cursor color (unchanged from your original)
  const fatigueColors = { Low: "#6af7b4", Medium: "#f7d96a", High: "#f76a6a" };
  const color = fatigueColors[fatigue?.level] || "#6af7b4";

  // Convert normalized position (0–1) → screen pixels
  const screenX = (gesture.position?.x ?? 0.5) * window.innerWidth;
  const screenY = (gesture.position?.y ?? 0.5) * window.innerHeight;

  // ── Per-mode visual config ──────────────────
  const modeStyle = {
    idle: {
      outerSize: 20,
      outerBorder: `2px solid transparent`,
      outerBg: "transparent",
      outerShadow: "none",
      innerSize: 0,
      opacity: 0,
    },
    palm: {
      // Open ring — navigation cursor
      outerSize: 28,
      outerBorder: `2px solid ${color}`,
      outerBg: "transparent",
      outerShadow: `0 0 12px ${color}55`,
      innerSize: 5,
      opacity: 1,
    },
    grab: {
      // Filled dot — grab/drag cursor
      outerSize: 20,
      outerBorder: `2px solid ${color}`,
      outerBg: `${color}33`,
      outerShadow: `0 0 16px ${color}88`,
      innerSize: 10,
      opacity: 1,
    },
  }[gesture.mode] ?? modeStyle?.idle ?? {
    outerSize: 20, outerBorder: "2px solid transparent",
    outerBg: "transparent", outerShadow: "none", innerSize: 0, opacity: 0,
  };

  // Pinch overrides everything — pulse ring flash
  const isPinching = gesture.pinch;

  return (
    <>
      {/* ── Outer ring ───────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          left: screenX,
          top: screenY,
          transform: "translate(-50%, -50%)",
          width: isPinching ? 38 : modeStyle.outerSize,
          height: isPinching ? 38 : modeStyle.outerSize,
          borderRadius: "50%",
          border: isPinching ? `2px solid ${color}` : modeStyle.outerBorder,
          background: isPinching ? `${color}22` : modeStyle.outerBg,
          boxShadow: isPinching ? `0 0 24px ${color}99` : modeStyle.outerShadow,
          opacity: modeStyle.opacity,
          // Smooth position tracking — fast enough to feel responsive
          transition: "width 0.1s ease, height 0.1s ease, opacity 0.15s ease, box-shadow 0.1s ease, background 0.1s ease",
          pointerEvents: "none",
          zIndex: 9999,
          // Pinch animation
          animation: isPinching ? "cursorPinchPulse 0.35s ease both" : "none",
        }}
      />

      {/* ── Inner dot ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          left: screenX,
          top: screenY,
          transform: "translate(-50%, -50%)",
          width: isPinching ? 8 : modeStyle.innerSize,
          height: isPinching ? 8 : modeStyle.innerSize,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          opacity: isPinching ? 1 : modeStyle.opacity,
          transition: "width 0.1s ease, height 0.1s ease, opacity 0.15s ease",
          pointerEvents: "none",
          zIndex: 10000,
        }}
      />

      {/* ── Mode label (small tag below cursor) ──────────────────────── */}
      {gesture.mode !== "idle" && (
        <div
          style={{
            position: "fixed",
            left: screenX,
            top: screenY + 20,
            transform: "translateX(-50%)",
            fontFamily: "var(--mono, monospace)",
            fontSize: 9,
            letterSpacing: "0.12em",
            color: color,
            opacity: 0.65,
            pointerEvents: "none",
            zIndex: 9999,
            whiteSpace: "nowrap",
            transition: "top 0.1s ease",
          }}
        >
          {isPinching ? "PINCH" : gesture.mode.toUpperCase()}
        </div>
      )}

      {/* ── Swipe direction flash ─────────────────────────────────────── */}
      {gesture.swipe && (
        <div
          style={{
            position: "fixed",
            left: screenX,
            top: screenY - 28,
            transform: "translateX(-50%)",
            fontFamily: "var(--mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "#ffcc44",
            pointerEvents: "none",
            zIndex: 9999,
            whiteSpace: "nowrap",
            animation: "cursorSwipeFlash 0.5s ease both",
          }}
        >
          {gesture.swipe === "left" ? "← SWIPE" : "SWIPE →"}
        </div>
      )}

      {/* ── Keyframes ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes cursorPinchPulse {
          0%   { transform: translate(-50%, -50%) scale(1); }
          40%  { transform: translate(-50%, -50%) scale(1.5); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes cursorSwipeFlash {
          0%   { opacity: 0; transform: translateX(-50%) translateY(4px); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}

export default GestureCursor;