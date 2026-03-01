// ─────────────────────────────────────────────
// APPSHELL
// ─────────────────────────────────────────────
import { useApp } from "../context/AppContext";
import Sidebar from "./Sidebar";

function AppShell({ children }) {
  const { activeApp, gesture } = useApp();
  const appNames = { calculator: "Calculator", todo: "To-Do", analytics: "Analytics" };

  // Gesture mode → display label + color
  const modeConfig = {
    idle:  { label: "IDLE",  color: "var(--text-dim)" },
    palm:  { label: "PALM",  color: "#9b6dff" },
    grab:  { label: "GRAB",  color: "#0ea5e9" },
  };
  const mode = modeConfig[gesture?.mode] || modeConfig.idle;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── TopBar ──────────────────────────────────────────────────────── */}
        <div style={{
          height: 48,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 12,
          flexShrink: 0,
        }}>
          {/* Breadcrumb */}
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 3 }}>
            VISION INTERFACE
          </span>
          <span style={{ color: "var(--border)" }}>›</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2 }}>
            {appNames[activeApp] || activeApp}
          </span>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* ── Gesture status pill (right side of TopBar) ── */}
          {gesture?.enabled && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 100,
            }}>
              {/* Live dot */}
              <div style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: gesture.mode === "idle" ? "rgba(255,255,255,0.2)" : "#9b6dff",
                boxShadow: gesture.mode !== "idle" ? "0 0 6px #9b6dff" : "none",
                transition: "background 0.2s, box-shadow 0.2s",
              }} />

              {/* Mode label */}
              <span style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: 3,
                color: mode.color,
                transition: "color 0.2s",
              }}>
                {mode.label}
              </span>

              {/* Pinch flash */}
              {gesture.pinch && (
                <span style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "#00c864",
                  animation: "topbarPinchFlash 0.3s ease both",
                }}>
                  PINCH
                </span>
              )}

              {/* Swipe flash */}
              {gesture.swipe && (
                <span style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "#ffcc44",
                  animation: "topbarPinchFlash 0.3s ease both",
                }}>
                  {gesture.swipe === "left" ? "← SWIPE" : "SWIPE →"}
                </span>
              )}
            </div>
          )}

          {/* Gesture offline indicator */}
          {!gesture?.enabled && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 100,
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.15)" }}>
                NO GESTURE
              </span>
            </div>
          )}
        </div>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes topbarPinchFlash {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default AppShell;