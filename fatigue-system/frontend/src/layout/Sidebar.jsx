// ─────────────────────────────────────────────
// SIDEBAR (Gesture-aware version)
// ─────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { APPS } from "../config/appsConfig";

// ─────────────────────────────────────────────
// useGestureHover
// Returns true when the gesture cursor is positioned
// over a given DOM element ref.
// Uses normalized gesture.position (0–1) mapped to screen pixels.
// ─────────────────────────────────────────────
function useGestureHover(ref, gestureEnabled, gesturePosition) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!gestureEnabled || !ref.current) {
      setHovered(false);
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const cursorX = gesturePosition.x * window.innerWidth;
    const cursorY = gesturePosition.y * window.innerHeight;

    const isOver =
      cursorX >= rect.left &&
      cursorX <= rect.right &&
      cursorY >= rect.top &&
      cursorY <= rect.bottom;

    setHovered(isOver);
  }, [gesturePosition, gestureEnabled, ref]);

  return hovered;
}

// ─────────────────────────────────────────────
// SidebarBtn — gesture + mouse aware
// ─────────────────────────────────────────────
function SidebarBtn({ icon, title, onClick, accent, active, gesture }) {
  const ref = useRef(null);
  const [mouseHov, setMouseHov] = useState(false);

  // Gesture hover detection
  const gestureHov = useGestureHover(ref, gesture?.enabled, gesture?.position ?? { x: -1, y: -1 });

  // Combined hover state — either mouse or gesture cursor over this button
  const isHovered = mouseHov || gestureHov;

  // Pinch while gesture is hovering → trigger click (rising edge only)
  useEffect(() => {
    if (gestureHov && gesture?.pinch) {
      onClick?.();
    }
  }, [gesture?.pinch, gestureHov]); // only re-runs when pinch state changes

  return (
    <button
      ref={ref}
      title={title}
      onClick={onClick}
      onMouseEnter={() => setMouseHov(true)}
      onMouseLeave={() => setMouseHov(false)}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: active || isHovered ? `${accent}22` : "transparent",
        border: `1px solid ${active || isHovered ? accent : "transparent"}`,
        color: active || isHovered ? accent : "var(--text-dim)",
        fontSize: 18,
        cursor: "none",
        transition: "all var(--transition)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Subtle scale-up when gesture is hovering (distinguishes from mouse hover)
        transform: gestureHov ? "scale(1.12)" : "scale(1)",
        boxShadow: gestureHov ? `0 0 10px ${accent}44` : "none",
      }}
    >
      {icon}
    </button>
  );
}

// ─────────────────────────────────────────────
// FatigueBtn — gesture-aware fatigue toggle
// ─────────────────────────────────────────────
function FatigueBtn({ fatigue, setFatigue, gesture }) {
  const ref = useRef(null);
  const [mouseHov, setMouseHov] = useState(false);

  const fatigueColors = {
    Low: "#6af7b4",
    Medium: "#f7d96a",
    High: "#f76a6a",
  };

  const color = fatigueColors[fatigue.level];
  const gestureHov = useGestureHover(ref, gesture?.enabled, gesture?.position ?? { x: -1, y: -1 });

  const handleCycle = () => {
    const levels = ["Low", "Medium", "High"];
    const configs = {
      Low:    { hoverDelay: 700, jitterTolerance: 8,  cursorSnapStrength: 0.3 },
      Medium: { hoverDelay: 550, jitterTolerance: 14, cursorSnapStrength: 0.5 },
      High:   { hoverDelay: 400, jitterTolerance: 20, cursorSnapStrength: 0.7 },
    };
    setFatigue(f => {
      const next = levels[(levels.indexOf(f.level) + 1) % 3];
      return { ...f, level: next, mode: "manual", ...configs[next] };
    });
  };

  // Pinch while hovering → cycle fatigue level
  useEffect(() => {
    if (gestureHov && gesture?.pinch) {
      handleCycle();
    }
  }, [gesture?.pinch, gestureHov]);

  return (
    <div
      ref={ref}
      title={`Fatigue: ${fatigue.level}`}
      onClick={handleCycle}
      onMouseEnter={() => setMouseHov(true)}
      onMouseLeave={() => setMouseHov(false)}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: `${color}22`,
        border: `1px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "none",
        color: color,
        fontSize: 11,
        fontFamily: "var(--mono)",
        fontWeight: 700,
        transform: gestureHov ? "scale(1.12)" : "scale(1)",
        boxShadow: gestureHov ? `0 0 10px ${color}44` : "none",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
    >
      {fatigue.level[0]}
    </div>
  );
}

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
function Sidebar() {
  const { navigate, activeApp, setActiveApp, fatigue, setFatigue, gesture, resetGesture } = useApp();

  const handleLogout = () => {
    resetGesture?.();   // clear gesture state on logout
    navigate("login");
  };

  return (
    <div
      style={{
        width: 64,
        height: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0",
        gap: 12,
        flexShrink: 0,
      }}
    >
      {/* Home */}
      <SidebarBtn
        title="Home"
        icon="⌂"
        accent="var(--accent)"
        active={!activeApp}
        gesture={gesture}
        onClick={() => {
          setActiveApp(null);
          navigate("home");
        }}
      />

      {/* App Icons */}
      {APPS.filter(app => app.available).map(app => (
        <SidebarBtn
          key={app.id}
          title={app.label}
          icon={app.icon}
          accent="var(--accent)"
          active={activeApp === app.id}
          gesture={gesture}
          onClick={() => {
            setActiveApp(app.id);
            navigate("app");
          }}
        />
      ))}

      <div style={{ flex: 1 }} />

      {/* Fatigue Toggle */}
      <FatigueBtn
        fatigue={fatigue}
        setFatigue={setFatigue}
        gesture={gesture}
      />

      {/* Logout */}
      <SidebarBtn
        title="Logout"
        icon="↩"
        accent="var(--danger)"
        gesture={gesture}
        onClick={handleLogout}
      />
    </div>
  );
}

export default Sidebar;