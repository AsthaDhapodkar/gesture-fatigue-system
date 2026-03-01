// ─────────────────────────────────────────────
// ROOT APP (Cleaned & Scalable)
// ─────────────────────────────────────────────
import { useApp } from "../context/AppContext";
import GestureEngine from "../gesture/GestureEngine";
import FatigueEngine from "../fatigue/FatigueEngine";
import GestureCursor from "../layout/GestureCursor";
import LoginPage from "../pages/LoginPage";
import Home from "../pages/Home";
import AppShell from "../layout/AppShell";
import Calculator from "../features/calculator/Calculator";
import Todo from "../features/todo/Todo";

function App() {
  const { page, activeApp, gesture } = useApp();

  const APP_COMPONENTS = {
    calculator: Calculator,
    todo: Todo,
  };

  const ActiveComponent = APP_COMPONENTS[activeApp];

  return (
    <div className="app-root" style={{ height: "100vh" }}>

      {/*
        GestureEngine — mounts once for the entire app lifetime.
        It is the ONLY component that talks to MediaPipe and the camera.
        It reads/writes gesture state via updateGesture() from AppContext.
        Renders nothing visible (hidden video element internally).
        Set debug={true} to show a live camera preview with landmarks.
      */}
      <GestureEngine debug={false} />

      {/*
        FatigueEngine — monitors continuous gesture usage.
        Shows a warning banner after thresholds are exceeded.
        Reads gesture.mode from context, no camera access needed.
      */}
      <FatigueEngine />

      {/*
        GestureCursor — floating cursor that follows hand position.
        Only renders when gesture.enabled is true (after camera permission).
        Reflects current gesture mode visually (palm / grab / idle).
      */}
      <GestureCursor />

      {/* ── Page Routing ───────────────────────────────────────────── */}

      {page === "login" && <LoginPage />}

      {page === "home" && <Home />}

      {page === "app" && (
        <AppShell>
          {ActiveComponent ? <ActiveComponent /> : <Home />}
        </AppShell>
      )}

    </div>
  );
}

export default App;