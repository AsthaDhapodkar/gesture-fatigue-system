// ─────────────────────────────────────────────
// HOME — APP LAUNCHER GRID
// ─────────────────────────────────────────────
import { useApp } from "../context/AppContext";
import { useState } from "react";
import { APPS } from "../config/appsConfig";

function Home() {
  const { navigate, user } = useApp();
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      padding: "40px 48px",
      background: "radial-gradient(ellipse at 30% 70%, #0f0a20 0%, var(--bg) 60%)",
    }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: "var(--mono)", color: "var(--text-dim)", fontSize: 12, letterSpacing: 3, marginBottom: 4 }}>
          WELCOME BACK
        </div>
        <h2 style={{ fontFamily: "var(--sans)", fontSize: 32, fontWeight: 800 }}>
          {user?.name || "User"}
        </h2>
      </div>

      <div style={{ fontFamily: "var(--mono)", color: "var(--text-dim)", fontSize: 11, letterSpacing: 3, marginBottom: 20 }}>
        SELECT APPLICATION
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {APPS.map(app => (
          <div
            key={app.id}
            onMouseEnter={() => setHovered(app.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => app.available && navigate("app", app.id)}
            style={{
              width: 180,
              height: 180,
              borderRadius: 20,
              background: hovered === app.id && app.available
                ? `linear-gradient(135deg, ${app.color}22, ${app.color}44)`
                : "var(--surface)",
              border: `1px solid ${hovered === app.id ? app.color : "var(--border)"}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              cursor: app.available ? "none" : "default",
              opacity: app.available ? 1 : 0.4,
              transition: "all var(--transition)",
              boxShadow: hovered === app.id && app.available ? `0 0 30px ${app.color}33` : "none",
              transform: hovered === app.id && app.available ? "scale(1.03)" : "scale(1)",
            }}
          >
            <div style={{ fontSize: 48, color: app.color }}>{app.icon}</div>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 15 }}>{app.label}</div>
            {!app.available && (
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", letterSpacing: 2 }}>
                SOON
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;