// ─────────────────────────────────────────────
// CALCULATOR MODULE
//
// Responsibilities:
//  • UI layout (display, buttons, history panel)
//  • Expression + result state
//  • History management (add, dedup, clear)
//  • Session persistence via sessionStorage
//  • Fatigue-aware layout (hoverDelay → CalcButton)
//  • Pinch gesture → evaluate "="
//
// Logic lives in calculatorLogic.js.
// Button interaction lives in CalcButton.jsx.
//
// GESTURE CHANGES:
//  • Removed manual prevPinch rising-edge ref — GestureEngine
//    already emits pinch=true for ONE frame only, so we just
//    react directly to gesture.pinch in a useEffect.
//  • History CLEAR button is now gesture-hoverable + pinch-clickable.
//  • Gesture status strip added to display card.
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../../context/AppContext";
import calcLogic from "./calculatorLogic";
import CalcButton from "./CalcButton";

// ── Session storage keys ──────────────────────
const SS_EXPR    = "calc_expr";
const SS_HISTORY = "calc_history";

// ── Button map ────────────────────────────────
const BUTTONS = [
  { label: "C",  variant: "action"   },
  { label: "⌫", variant: "action"   },
  { label: "%",  variant: "operator" },
  { label: "÷",  variant: "operator" },

  { label: "7",  variant: "number"   },
  { label: "8",  variant: "number"   },
  { label: "9",  variant: "number"   },
  { label: "×",  variant: "operator" },

  { label: "4",  variant: "number"   },
  { label: "5",  variant: "number"   },
  { label: "6",  variant: "number"   },
  { label: "-",  variant: "operator" },

  { label: "1",  variant: "number"   },
  { label: "2",  variant: "number"   },
  { label: "3",  variant: "number"   },
  { label: "+",  variant: "operator" },

  { label: "0",  variant: "number"   },
  { label: ".",  variant: "special"  },
  { label: "=",  variant: "equals"   },
];

// ── Helpers ───────────────────────────────────
const ssGet = (key, fallback) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const ssSet = (key, value) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
};

// ─────────────────────────────────────────────
// useGestureHover — reusable within this file
// Returns true when gesture cursor overlaps a given ref element.
// ─────────────────────────────────────────────
function useGestureHover(ref, gesture) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!gesture?.enabled || !ref.current) {
      setHovered(false);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const cursorX = (gesture.position?.x ?? -1) * window.innerWidth;
    const cursorY = (gesture.position?.y ?? -1) * window.innerHeight;
    setHovered(
      cursorX >= rect.left &&
      cursorX <= rect.right &&
      cursorY >= rect.top  &&
      cursorY <= rect.bottom
    );
  }, [gesture?.position, gesture?.enabled]);

  return hovered;
}

// ─────────────────────────────────────────────
function Calculator() {
  const { fatigue, gesture } = useApp();

  // ── State ─────────────────────────────────
  const [expr, setExpr]       = useState(() => ssGet(SS_EXPR, "0"));
  const [result, setResult]   = useState(null);
  const [history, setHistory] = useState(() => ssGet(SS_HISTORY, []));

  const lastEvaluatedExpr = useRef(null);

  // ── Persist to sessionStorage ──────────────
  useEffect(() => { ssSet(SS_EXPR, expr); }, [expr]);
  useEffect(() => { ssSet(SS_HISTORY, history); }, [history]);

  // ── Evaluate helper ────────────────────────
  const evaluateExpression = useCallback((currentExpr) => {
    if (currentExpr === lastEvaluatedExpr.current) return;
    const r = calcLogic.evaluate(currentExpr);
    if (r === null) return;
    setResult(r);
    setExpr(r === "Error" ? "0" : r);
    if (calcLogic.isValidForHistory(currentExpr, r)) {
      const entry = `${currentExpr} = ${r}`;
      setHistory(h => {
        if (h[0] === entry) return h;
        return [entry, ...h].slice(0, 20);
      });
    }
    lastEvaluatedExpr.current = currentExpr;
  }, []);

  // ── Button handler ─────────────────────────
  const handleSelect = useCallback((label) => {
    if (label === "C") {
      setExpr("0"); setResult(null); lastEvaluatedExpr.current = null; return;
    }
    if (label === "⌫") {
      setResult(null); setExpr(e => calcLogic.backspace(e)); return;
    }
    if (label === "=") {
      setExpr(e => { evaluateExpression(e); return e; }); return;
    }
    setResult(null);
    setExpr(e => {
      const isOp = ["+", "-", "×", "÷", "%"].includes(label);
      const isStartingFresh = lastEvaluatedExpr.current !== null && !isOp;
      lastEvaluatedExpr.current = null;
      return calcLogic.append(isStartingFresh ? "0" : e, label);
    });
  }, [evaluateExpression]);

  // ── Pinch → evaluate "=" ───────────────────
  // GestureEngine already handles rising-edge detection:
  // gesture.pinch is true for EXACTLY ONE frame per pinch.
  // So we just react to it directly — no manual prevPinch ref needed.
  useEffect(() => {
    if (gesture?.pinch) {
      setExpr(e => { evaluateExpression(e); return e; });
    }
  }, [gesture?.pinch, evaluateExpression]);

  // ── Clear history ──────────────────────────
  const clearBtnRef = useRef(null);
  const clearGestureHovered = useGestureHover(clearBtnRef, gesture);

  const clearHistory = useCallback(() => {
    setHistory([]); ssSet(SS_HISTORY, []);
  }, []);

  // Pinch on hovered CLEAR button → clear history
  useEffect(() => {
    if (clearGestureHovered && gesture?.pinch) {
      clearHistory();
    }
  }, [gesture?.pinch, clearGestureHovered, clearHistory]);

  // ── Fatigue-derived values ─────────────────
  const fatigueColors = { Low: "#6af7b4", Medium: "#f7d96a", High: "#f76a6a" };
  const fatigueColor  = fatigueColors[fatigue.level];
  const gridGap       = fatigue.level === "High" ? 6 : fatigue.level === "Medium" ? 8 : 10;
  const historyWidth  = fatigue.level === "High" ? 190 : fatigue.level === "Medium" ? 220 : 260;
  const hoverDelay    = fatigue.level === "High" ? 3500 : fatigue.level === "Medium" ? 2500 : 1500;

  // Gesture mode color for status strip
  const gestureModeColor = { idle: "var(--text-dim)", palm: "#9b6dff", grab: "#0ea5e9" }[gesture?.mode] ?? "var(--text-dim)";

  // ─────────────────────────────────────────────
  return (
    <div style={{
      height: "100%", display: "flex", gap: 14,
      padding: 14, overflow: "hidden", boxSizing: "border-box",
    }}>

      {/* ══════════ LEFT — Display + Buttons ══════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minHeight: 0, overflow: "hidden" }}>

        {/* ── Display card ── */}
        <div style={{
          background: "var(--surface)", borderRadius: 16,
          border: "1px solid var(--border)", padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 10, flexShrink: 0,
        }}>
          {/* Number display */}
          <div style={{
            background: "var(--bg)", borderRadius: 10,
            border: "1px solid var(--border)", padding: "10px 14px",
            minHeight: 70, display: "flex", flexDirection: "column",
            alignItems: "flex-end", justifyContent: "flex-end", gap: 2,
          }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)",
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", maxWidth: "100%",
            }}>
              {result !== null ? expr : ""}
            </div>
            <div style={{
              fontFamily: "var(--mono)", fontWeight: 700,
              color: result ? "var(--accent)" : "var(--text)",
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", maxWidth: "100%",
              fontSize: Math.max(20, Math.min(30, 30 - Math.max(0, expr.length - 10) * 1.2)),
            }}>
              {result !== null ? result : expr}
            </div>
          </div>

          {/* Fatigue status strip (unchanged) */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 10px", borderRadius: 7,
            background: `${fatigueColor}11`, border: `1px solid ${fatigueColor}44`,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: fatigueColor, boxShadow: `0 0 7px ${fatigueColor}`,
            }} />
            <span style={{
              fontFamily: "var(--mono)", fontSize: 10,
              color: fatigueColor, letterSpacing: 1.5, whiteSpace: "nowrap",
            }}>
              FATIGUE: {fatigue.level.toUpperCase()} · HOVER {hoverDelay}ms
            </span>
          </div>

          {/* ── Gesture status strip (NEW) ── */}
          {gesture?.enabled && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "5px 10px", borderRadius: 7,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {/* Mode indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: gestureModeColor,
                  boxShadow: gesture?.mode !== "idle" ? `0 0 6px ${gestureModeColor}` : "none",
                  transition: "background 0.2s",
                }} />
                <span style={{
                  fontFamily: "var(--mono)", fontSize: 9,
                  color: gestureModeColor, letterSpacing: 2,
                }}>
                  {(gesture?.mode ?? "idle").toUpperCase()}
                </span>
              </div>

              {/* Pinch hint / active flash */}
              <span style={{
                fontFamily: "var(--mono)", fontSize: 9, letterSpacing: 2,
                color: gesture?.pinch ? "#00c864" : "var(--text-dim)",
                transition: "color 0.1s",
              }}>
                {gesture?.pinch ? "PINCH ✓" : "PINCH = EVALUATE"}
              </span>
            </div>
          )}

          {/* Gesture hint */}
          <div style={{
            fontFamily: "var(--mono)", fontSize: 9,
            color: "var(--text-dim)", textAlign: "center", letterSpacing: 1,
          }}>
            HOVER → SELECT &nbsp;·&nbsp; CLICK / PINCH → EVALUATE (=)
          </div>
        </div>

        {/* ── Button grid ── */}
        <div style={{
          flex: 1, minHeight: 0,
          background: "var(--surface)", borderRadius: 16,
          border: "1px solid var(--border)", padding: 10,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(5, 1fr)",
          gap: gridGap, overflow: "hidden",
        }}>
          {BUTTONS.map((btn, i) => (
            <div
              key={i}
              style={{
                gridColumn: btn.label === "0" ? "span 2" : undefined,
                minWidth: 0, minHeight: 0,
              }}
            >
              <CalcButton
                {...btn}
                onSelect={handleSelect}
                hoverDelay={hoverDelay}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ RIGHT — History panel ══════════ */}
      <div style={{
        width: historyWidth, flexShrink: 0,
        background: "var(--surface)", borderRadius: 16,
        border: "1px solid var(--border)", padding: 14,
        display: "flex", flexDirection: "column",
        overflow: "hidden", transition: "width 0.3s ease",
      }}>
        {/* Header row with gesture-aware CLEAR button */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 12, flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "var(--mono)", fontSize: 10,
            color: "var(--text-dim)", letterSpacing: 3,
          }}>
            HISTORY
          </span>

          {history.length > 0 && (
            <button
              ref={clearBtnRef}
              onClick={clearHistory}
              style={{
                background: clearGestureHovered ? "#f76a6a22" : "transparent",
                border: `1px solid ${clearGestureHovered ? "#f76a6a" : "var(--danger)"}`,
                borderRadius: 6, color: "var(--danger)",
                fontFamily: "var(--mono)", fontSize: 9,
                letterSpacing: 1, padding: "3px 8px",
                cursor: "none", transition: "background 0.15s, transform 0.1s",
                // Scale up slightly when gesture is hovering over it
                transform: clearGestureHovered ? "scale(1.08)" : "scale(1)",
                boxShadow: clearGestureHovered ? "0 0 8px #f76a6a44" : "none",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f76a6a22"}
              onMouseLeave={e => {
                if (!clearGestureHovered) e.currentTarget.style.background = "transparent";
              }}
            >
              {clearGestureHovered && gesture?.pinch ? "CLEARING…" : "CLEAR"}
            </button>
          )}
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {history.length === 0 ? (
            <div style={{
              fontFamily: "var(--mono)", fontSize: 11,
              color: "var(--text-dim)", paddingTop: 4,
            }}>
              No entries yet
            </div>
          ) : (
            history.map((entry, i) => (
              <div key={i} style={{
                fontFamily: "var(--mono)", fontSize: 11,
                color: i === 0 ? "var(--text)" : "var(--text-dim)",
                padding: "7px 0", borderBottom: "1px solid var(--border)",
                wordBreak: "break-all", lineHeight: 1.5,
              }}>
                {entry}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Calculator;