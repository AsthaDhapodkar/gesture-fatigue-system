// ─────────────────────────────────────────────
// LOGIN PAGE — Two-column split layout
// Left: Branding / Hero panel
// Right: Auth form (Login / Sign Up / Guest)
//
// GESTURE CHANGE: Camera permission is requested ONCE here,
// immediately after auth succeeds. GestureEngine then takes
// over the stream silently — no module ever calls getUserMedia again.
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

// ─── Mock Auth Helpers ────────────────────────────────────────────────────────
const mockLogin = async (email, password) => {
  await new Promise(r => setTimeout(r, 800));
  if (email === "demo@example.com" && password === "password123") {
    return { ok: true, user: { name: "Demo User", email, isGuest: false } };
  }
  return { ok: false, error: "Invalid email or password." };
};

const mockSignUp = async (email, password) => {
  await new Promise(r => setTimeout(r, 900));
  if (email && password.length >= 6) {
    return { ok: true, user: { name: email.split("@")[0], email, isGuest: false } };
  }
  return { ok: false, error: "Sign up failed. Try again." };
};

// ─────────────────────────────────────────────
// requestCameraPermission
// Called once after auth succeeds.
// Opens and immediately closes a test stream so the browser
// stores the permission grant. GestureEngine opens its own
// stream independently — this just pre-warms the permission.
// Returns: "granted" | "denied" | "error"
// ─────────────────────────────────────────────
async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    stream.getTracks().forEach(track => track.stop()); // close test stream immediately
    return "granted";
  } catch (err) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return "denied";
    }
    return "error";
  }
}

// ─── FocusInput ───────────────────────────────────────────────────────────────
function FocusInput({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        background: focused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? "#7c3aed" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 10,
        color: "#eae6ff",
        fontFamily: "var(--mono, monospace)",
        fontSize: 14,
        padding: "13px 16px",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        transition: "border-color 0.2s, background 0.2s",
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Decorative floating card for the left panel ─────────────────────────────
function FloatCard({ style, children }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14,
      padding: "14px 18px",
      backdropFilter: "blur(12px)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── CameraStatusBanner ───────────────────────────────────────────────────────
// Shown briefly after permission request resolves.
function CameraStatusBanner({ status }) {
  if (!status) return null;

  const config = {
    requesting: { bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.3)", color: "#9b6dff", icon: "◌", text: "Requesting camera access…" },
    granted:    { bg: "rgba(0,200,100,0.08)",   border: "rgba(0,200,100,0.25)", color: "#00c864", icon: "✓", text: "Camera access granted. Gesture control active." },
    denied:     { bg: "rgba(255,100,80,0.08)",  border: "rgba(255,100,80,0.25)", color: "#ff7070", icon: "⚠", text: "Camera denied. Gesture control unavailable — mouse/keyboard only." },
    error:      { bg: "rgba(255,180,0,0.08)",   border: "rgba(255,180,0,0.25)", color: "#ffcc44", icon: "⚠", text: "Camera error. Continuing without gesture control." },
  }[status];

  if (!config) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "11px 14px",
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 10,
      animation: "fadeIn 0.25s ease both",
      marginTop: 2,
    }}>
      <span style={{
        color: config.color,
        fontSize: 14,
        animation: status === "requesting" ? "spin 1s linear infinite" : "none",
        display: "inline-block",
        flexShrink: 0,
      }}>
        {config.icon}
      </span>
      <span style={{
        color: config.color,
        fontFamily: "var(--mono, monospace)",
        fontSize: 11,
        letterSpacing: "0.04em",
        lineHeight: 1.4,
      }}>
        {config.text}
      </span>
    </div>
  );
}

// ─── Main LoginPage ───────────────────────────────────────────────────────────
function LoginPage() {
  const { navigate, setUser, enableGesture } = useApp();

  const [mode, setMode]               = useState("login");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  // Camera permission flow state
  // "idle" | "requesting" | "granted" | "denied" | "error"
  const [cameraStatus, setCameraStatus] = useState("idle");

  // Responsive
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const switchMode = (m) => {
    setMode(m); setError(""); setConfirm(""); setPassword("");
  };

  // ── Shared post-auth flow ─────────────────────────────────────────────────
  // Called after any successful auth (login / signup / guest).
  // 1. Request camera permission
  // 2. If granted → call enableGesture() so GestureEngine activates
  // 3. Navigate to home regardless of camera outcome
  const postAuth = async (user) => {
    setUser(user);
    setCameraStatus("requesting");

    const result = await requestCameraPermission();
    setCameraStatus(result);

    if (result === "granted") {
      // Signal AppContext that camera is ready — GestureEngine will activate
      enableGesture();
    }

    // Short delay so user sees the camera status feedback before navigating
    await new Promise(r => setTimeout(r, result === "granted" ? 600 : 1600));
    navigate("home");
  };

  // ── Guest ─────────────────────────────────────────────────────────────────
  const handleGuest = async () => {
    await postAuth({ name: "Guest", email: null, isGuest: true });
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    const r = await mockLogin(email, password);
    setLoading(false);
    if (r.ok) {
      await postAuth(r.user);
    } else {
      setError(r.error);
    }
  };

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    setError("");
    if (!email || !password || !confirm) { setError("Please fill in all fields."); return; }
    if (password !== confirm)            { setError("Passwords do not match."); return; }
    if (password.length < 6)             { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const r = await mockSignUp(email, password);
    setLoading(false);
    if (r.ok) {
      await postAuth(r.user);
    } else {
      setError(r.error);
    }
  };

  const handleSubmit  = () => mode === "login" ? handleLogin() : handleSignUp();
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  // Disable inputs while camera permission is being requested
  const isLocked = cameraStatus === "requesting" || cameraStatus === "granted";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "stretch",
      background: "#0a0812",
      fontFamily: "var(--sans, sans-serif)",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ── Global styles ─────────────────────────────────────────────────── */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: rgba(200,190,255,0.3) !important; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #120d24 inset !important;
          -webkit-text-fill-color: #eae6ff !important;
          caret-color: #eae6ff;
        }
        @keyframes floatA { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        @keyframes pulse  { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT PANEL — Branding / Hero (unchanged)
      ══════════════════════════════════════════════════════════════════════ */}
      {!isMobile && (
        <div style={{
          flex: "0 0 52%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 56px",
          background: "radial-gradient(ellipse at 40% 40%, #1e0f40 0%, #0a0812 75%)",
          overflow: "hidden",
        }}>

          {/* Grid */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}/>

          {/* Glow blobs */}
          <div style={{
            position: "absolute", width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(112,60,255,0.22) 0%, transparent 65%)",
            top: "-10%", left: "10%", pointerEvents: "none",
          }}/>
          <div style={{
            position: "absolute", width: 300, height: 300, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(60,200,255,0.1) 0%, transparent 70%)",
            bottom: "5%", right: "0%", pointerEvents: "none",
          }}/>

          {/* Content */}
          <div style={{ position: "relative", width: "100%", maxWidth: 460 }}>

            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--mono, monospace)",
              color: "#9b6dff",
              fontSize: 10, letterSpacing: 4,
              padding: "6px 14px",
              border: "1px solid rgba(124,58,237,0.35)",
              borderRadius: 100,
              background: "rgba(124,58,237,0.1)",
              marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#9b6dff", display: "inline-block", animation: "pulse 2s infinite" }}/>
              VISION INTERACTION SYSTEM v1.0
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(48px, 5.5vw, 76px)",
              fontWeight: 900,
              lineHeight: 1.0,
              color: "#eae6ff",
              letterSpacing: -3,
              marginBottom: 16,
            }}>
              Gesture<br/>
              <span style={{
                color: "transparent",
                backgroundImage: "linear-gradient(135deg, #a87cff 0%, #6025d6 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}>Interface</span>
            </h1>

            <p style={{
              color: "rgba(200,190,255,0.5)",
              fontSize: 14,
              fontFamily: "var(--mono, monospace)",
              letterSpacing: 2,
              marginBottom: 48,
            }}>
              Hands-free. Adaptive. Intelligent.
            </p>

            {/* Floating feature cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              <FloatCard style={{ animation: "floatA 4s ease-in-out infinite", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, #7c3aed, #5b1fd1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>✋</div>
                <div>
                  <div style={{ color: "#eae6ff", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Real-time Gesture Control</div>
                  <div style={{ color: "rgba(200,190,255,0.45)", fontSize: 11, fontFamily: "var(--mono, monospace)" }}>Camera-based hands-free interaction</div>
                </div>
              </FloatCard>

              <FloatCard style={{ animation: "floatB 5s ease-in-out infinite", marginLeft: 24, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>📊</div>
                <div>
                  <div style={{ color: "#eae6ff", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Session Analytics</div>
                  <div style={{ color: "rgba(200,190,255,0.45)", fontSize: 11, fontFamily: "var(--mono, monospace)" }}>Track usage across sessions</div>
                </div>
              </FloatCard>

              <FloatCard style={{ animation: "floatA 6s ease-in-out infinite 1s", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, #10b981, #047857)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>🧠</div>
                <div>
                  <div style={{ color: "#eae6ff", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Adaptive AI Engine</div>
                  <div style={{ color: "rgba(200,190,255,0.45)", fontSize: 11, fontFamily: "var(--mono, monospace)" }}>Learns your gesture patterns</div>
                </div>
              </FloatCard>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PANEL — Auth Form
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "40px 20px" : "60px 48px",
        background: "rgba(255,255,255,0.015)",
        borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto",
        position: "relative",
      }}>

        {/* Mobile-only header */}
        {isMobile && (
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              display: "inline-block",
              fontFamily: "var(--mono, monospace)",
              color: "#9b6dff", fontSize: 9, letterSpacing: 4,
              padding: "5px 12px",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: 100,
              background: "rgba(124,58,237,0.08)",
              marginBottom: 14,
            }}>
              VISION INTERACTION SYSTEM v1.0
            </div>
            <h1 style={{
              fontSize: 44, fontWeight: 900, lineHeight: 1,
              color: "#eae6ff", letterSpacing: -2, marginBottom: 8,
            }}>
              Gesture<br/>
              <span style={{
                color: "transparent",
                backgroundImage: "linear-gradient(135deg, #a87cff 0%, #6025d6 100%)",
                WebkitBackgroundClip: "text", backgroundClip: "text",
              }}>Interface</span>
            </h1>
            <p style={{ color: "rgba(200,190,255,0.45)", fontSize: 12, fontFamily: "var(--mono,monospace)", letterSpacing: 2 }}>
              Hands-free. Adaptive. Intelligent.
            </p>
          </div>
        )}

        {/* ── Form Container ──────────────────────────────────────────────── */}
        <div style={{ width: "100%", maxWidth: 400, animation: "fadeIn 0.4s ease both" }}>

          {/* Greeting */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              color: "#eae6ff", fontSize: 26, fontWeight: 800,
              letterSpacing: -0.8, marginBottom: 6,
            }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p style={{ color: "rgba(200,190,255,0.4)", fontSize: 13, fontFamily: "var(--mono, monospace)" }}>
              {mode === "login"
                ? "Sign in to access your dashboard."
                : "Join to unlock session history & analytics."}
            </p>
          </div>

          {/* ── Mode Toggle ───────────────────────────────────────────────── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 13, padding: 4, marginBottom: 22,
          }}>
            {[["login","LOGIN"], ["signup","SIGN UP"]].map(([m, label]) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                disabled={isLocked}
                style={{
                  background: mode === m
                    ? "linear-gradient(135deg, #7c3aed 0%, #6025d6 100%)"
                    : "transparent",
                  border: "none", borderRadius: 10,
                  color: mode === m ? "#fff" : "rgba(200,190,255,0.4)",
                  fontFamily: "var(--mono, monospace)",
                  fontSize: 11, fontWeight: 700, letterSpacing: 2,
                  padding: "10px 0", cursor: isLocked ? "not-allowed" : "pointer",
                  transition: "all 0.22s ease",
                  boxShadow: mode === m ? "0 2px 14px rgba(112,60,255,0.45)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Fields ────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            <FocusInput
              type="email" name="email" autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLocked}
            />

            <FocusInput
              type="password" name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLocked}
            />

            {mode === "signup" && (
              <div style={{ animation: "fadeIn 0.25s ease both" }}>
                <FocusInput
                  type="password" name="confirm-password" autoComplete="new-password"
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLocked}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                color: "#ff7070", fontFamily: "var(--mono, monospace)", fontSize: 12,
                padding: "10px 14px", background: "rgba(255,80,80,0.07)",
                borderRadius: 9, border: "1px solid rgba(255,80,80,0.2)",
                display: "flex", alignItems: "center", gap: 8,
                animation: "fadeIn 0.2s ease both",
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            {/* ── Camera permission status banner ── */}
            <CameraStatusBanner status={cameraStatus === "idle" ? null : cameraStatus} />

            {/* Primary CTA */}
            <button
              onClick={handleSubmit}
              disabled={loading || isLocked}
              style={{
                marginTop: 6,
                background: (loading || isLocked)
                  ? "rgba(112,60,255,0.4)"
                  : "linear-gradient(135deg, #7c3aed 0%, #5b1fd1 100%)",
                border: "none", borderRadius: 11,
                color: "#fff", fontFamily: "var(--sans, sans-serif)",
                fontWeight: 700, fontSize: 13, padding: "15px 20px",
                cursor: (loading || isLocked) ? "not-allowed" : "pointer",
                letterSpacing: 1.5,
                transition: "opacity 0.2s, transform 0.15s",
                boxShadow: (loading || isLocked) ? "none" : "0 6px 24px rgba(112,60,255,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, width: "100%",
              }}
              onMouseEnter={e => { if (!loading && !isLocked) e.currentTarget.style.opacity = "0.87"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              onMouseDown={e => { if (!loading && !isLocked) e.currentTarget.style.transform = "scale(0.985)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? (
                <>
                  <span style={{ display:"inline-block", animation:"spin 0.8s linear infinite", fontSize:14 }}>◌</span>
                  PROCESSING…
                </>
              ) : cameraStatus === "requesting" ? (
                <>
                  <span style={{ display:"inline-block", animation:"spin 0.8s linear infinite", fontSize:14 }}>◌</span>
                  ACTIVATING CAMERA…
                </>
              ) : mode === "login" ? "ENTER SYSTEM →" : "CREATE ACCOUNT →"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0 2px" }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/>
              <span style={{ color:"rgba(200,190,255,0.28)", fontFamily:"var(--mono, monospace)", fontSize:10, letterSpacing:3 }}>OR</span>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/>
            </div>

            {/* Guest button */}
            <button
              onClick={handleGuest}
              disabled={isLocked}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 11,
                color: "rgba(200,190,255,0.5)",
                fontFamily: "var(--sans, sans-serif)",
                fontWeight: 600, fontSize: 13, padding: "13px 20px",
                cursor: isLocked ? "not-allowed" : "pointer",
                letterSpacing: 1.5,
                transition: "border-color 0.2s, color 0.2s, background 0.2s",
                width: "100%",
              }}
              onMouseEnter={e => {
                if (isLocked) return;
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)";
                e.currentTarget.style.color = "#eae6ff";
                e.currentTarget.style.background = "rgba(124,58,237,0.07)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(200,190,255,0.5)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              CONTINUE AS GUEST
            </button>

            <p style={{
              color: "rgba(200,190,255,0.22)", fontFamily: "var(--mono, monospace)",
              fontSize: 11, textAlign: "center", letterSpacing: 0.3, paddingTop: 2,
            }}>
              Guest sessions are temporary — data is not saved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;