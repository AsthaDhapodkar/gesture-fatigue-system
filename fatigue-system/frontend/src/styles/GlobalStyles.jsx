// ─────────────────────────────────────────────
// FONTS & GLOBAL STYLES
// ─────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:         #0a0a0f;
      --surface:    #12121a;
      --surface2:   #1a1a26;
      --border:     #2a2a3e;
      --accent:     #7c6af7;
      --accent2:    #f7a26a;
      --text:       #e8e8f0;
      --text-dim:   #6b6b8a;
      --danger:     #f76a6a;
      --ok:         #6af7b4;
      --mono:       'Space Mono', monospace;
      --sans:       'Syne', sans-serif;
      --radius:     12px;
      --transition: 180ms cubic-bezier(0.4,0,0.2,1);
    }

    html, body, #root {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      overflow: hidden;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    /* Custom cursor hidden on main app — gesture cursor replaces it */
    .app-root { cursor: none; }
  `}</style>
);

export default GlobalStyles;