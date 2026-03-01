// ─────────────────────────────────────────────
// APP CONTEXT
// ─────────────────────────────────────────────
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AppContext = createContext(null);

// ─────────────────────────────────────────────
// Default gesture state shape
// Updated by GestureEngine ONLY — never by modules
// ─────────────────────────────────────────────
const DEFAULT_GESTURE = {
  // Legacy fields (kept for backward compatibility)
  x: 0,
  y: 0,
  hoverTarget: null,

  // New structured gesture state
  enabled: false, // true after camera permission granted
  position: { x: 0.5, y: 0.5 }, // normalized 0–1 cursor position
  mode: "idle", // "idle" | "palm" | "grab"
  pinch: false, // true on rising edge ONLY (one frame)
  fist: false,
  swipe: null, // null | "left" | "right" — resets after one frame
};

export function AppProvider({ children }) {
  const [page, setPage] = useState("login"); // "login" | "home" | "app"
  const [activeApp, setActiveApp] = useState(null);
  const [user, setUser] = useState(null);

  // ── Gesture state ──────────────────────────────────────────────────────────
  const [gesture, setGesture] = useState(DEFAULT_GESTURE);

  // ── Fatigue state (unchanged from your original) ───────────────────────────
  const [fatigue, setFatigue] = useState({
    level: "Low", // "Low" | "Medium" | "High"
    mode: "automatic",
    buttonScaleMultiplier: 1,
    hoverDelay: 700,
    jitterTolerance: 8,
    cursorSnapStrength: 0.3,
  });

  // ─────────────────────────────────────────
  // navigate — same as your original
  // ─────────────────────────────────────────
  const navigate = useCallback((p, app = null) => {
    setPage(p);
    if (app) setActiveApp(app);
  }, []);

  // ─────────────────────────────────────────
  // updateGesture — called ONLY by GestureEngine
  // Merges partial updates into gesture state
  // Keeps legacy x/y in sync with new position
  // ─────────────────────────────────────────
  const updateGesture = useCallback((partial) => {
    setGesture((prev) => {
      const merged = { ...prev, ...partial };

      // Keep legacy x/y in sync if position was updated
      if (partial.position) {
        merged.x = partial.position.x;
        merged.y = partial.position.y;
      }

      return merged;
    });
  }, []);

  // ─────────────────────────────────────────
  // enableGesture — called after camera permission granted
  // ─────────────────────────────────────────
  const enableGesture = useCallback(() => {
    setGesture((prev) => ({ ...prev, enabled: true }));
  }, []);

  // ─────────────────────────────────────────
  // resetGesture — called on logout
  // ─────────────────────────────────────────
  const resetGesture = useCallback(() => {
    setGesture(DEFAULT_GESTURE);
  }, []);

  // ─────────────────────────────────────────
  // Fatigue auto-escalation (your original logic, unchanged)
  // ─────────────────────────────────────────
  useEffect(() => {
    if (fatigue.mode !== "automatic") return;
    const levels = ["Low", "Medium", "High"];
    const configs = {
      Low: {
        buttonScaleMultiplier: 1,
        hoverDelay: 700,
        jitterTolerance: 8,
        cursorSnapStrength: 0.3,
      },
      Medium: {
        buttonScaleMultiplier: 1.15,
        hoverDelay: 550,
        jitterTolerance: 14,
        cursorSnapStrength: 0.5,
      },
      High: {
        buttonScaleMultiplier: 1.3,
        hoverDelay: 400,
        jitterTolerance: 20,
        cursorSnapStrength: 0.7,
      },
    };
    const timer = setInterval(() => {
      setFatigue((f) => {
        const idx = levels.indexOf(f.level);
        const next = levels[Math.min(idx + 1, 2)];
        return { ...f, level: next, ...configs[next] };
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [fatigue.mode]);

  //this is for auth purpose dont touch it Astha
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ isGuest: false });
    }
  }, []);

  // ─────────────────────────────────────────
  // Todo state (for TodoList module)
  // ─────────────────────────────────────────
  const [todos, setTodos] = useState([
    { id: 1, text: "Open palm to navigate", done: false },
    { id: 2, text: "Pinch to confirm", done: false },
    { id: 3, text: "Swipe right to add", done: false },
  ]);

  const addTodo = useCallback((text) => {
    setTodos((prev) => [...prev, { id: Date.now(), text, done: false }]);
  }, []);

  const toggleTodo = useCallback((id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        // ── Original fields (unchanged) ──
        page,
        navigate,
        activeApp,
        setActiveApp,
        user,
        setUser,
        fatigue,
        setFatigue,

        // ── Gesture state ──
        gesture,
        setGesture, // kept for any legacy direct usage
        updateGesture, // preferred: used by GestureEngine
        enableGesture, // called after camera permission
        resetGesture, // called on logout

        // ── Todo state ──
        todos,
        addTodo,
        toggleTodo,
        deleteTodo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────

// Original hook — unchanged, all existing code keeps working
export const useApp = () => useContext(AppContext);

// New alias used by gesture system files
export const useAppContext = () => useContext(AppContext);
