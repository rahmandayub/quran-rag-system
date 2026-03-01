import { useState, useRef, useEffect } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Lateef:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --ink: #1a1208;
    --gold: #c8922a;
    --gold-light: #e8c06a;
    --teal: #2a6b6b;
    --warm-white: #faf7f2;
    --muted: #8a7d6a;
    --border: rgba(200,146,42,0.2);
    --shadow: rgba(26,18,8,0.08);
    --header-h: 64px;
  }

  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

  body {
    background: var(--warm-white);
    color: var(--ink);
    font-family: 'Cormorant Garamond', serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .page { position: relative; min-height: 100vh; padding-bottom: 4rem; }

  .bg-texture {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200,146,42,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(42,107,107,0.06) 0%, transparent 50%);
  }
  .noise {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 128px 128px;
  }

  /* HEADER */
  header {
    position: sticky; top: 0; z-index: 100;
    height: var(--header-h);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem;
    border-bottom: 1px solid var(--border);
    background: rgba(250,247,242,0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .logo { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; }
  .logo-mark {
    width: 34px; height: 34px; flex-shrink: 0;
    border: 1.5px solid var(--gold); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Lateef', serif; font-size: 1.05rem; color: var(--gold);
    position: relative;
  }
  .logo-mark::before {
    content: ''; position: absolute; inset: 3px;
    border-radius: 50%; border: 0.5px solid rgba(200,146,42,0.3);
  }
  .logo-text { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; letter-spacing: 0.02em; color: var(--ink); }
  .logo-text span { color: var(--gold); }

  .desktop-nav { display: flex; gap: 1.75rem; align-items: center; }
  .desktop-nav a { font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); text-decoration: none; transition: color 0.2s; white-space: nowrap; }
  .desktop-nav a:hover { color: var(--ink); }
  .nav-cta { padding: 0.45rem 1.1rem; border: 1px solid var(--gold); color: var(--gold) !important; border-radius: 2px; transition: all 0.2s !important; }
  .nav-cta:hover { background: var(--gold) !important; color: white !important; }

  .hamburger {
    display: none; flex-direction: column; justify-content: center;
    gap: 5px; width: 36px; height: 36px;
    background: none; border: none; cursor: pointer; padding: 4px;
  }
  .hamburger span { display: block; width: 22px; height: 1.5px; background: var(--ink); border-radius: 2px; transition: all 0.3s; transform-origin: center; }
  .hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  /* MOBILE DRAWER */
  .mobile-nav {
    position: fixed; top: var(--header-h); left: 0; right: 0; bottom: 0;
    background: rgba(250,247,242,0.99); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    z-index: 90; display: flex; flex-direction: column; padding: 1.5rem 1.5rem;
    transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
    overflow-y: auto;
  }
  .mobile-nav.open { transform: translateX(0); }
  .mobile-nav a { display: block; padding: 1rem 0; border-bottom: 1px solid var(--border); font-size: 1.35rem; font-weight: 300; color: var(--ink); text-decoration: none; transition: color 0.2s; }
  .mobile-nav a:hover { color: var(--gold); }
  .mobile-nav-cta { margin-top: 1.5rem; display: block; text-align: center; padding: 0.9rem; background: var(--gold); color: white !important; border-radius: 3px; font-size: 1rem !important; border: none !important; }

  /* HERO */
  .hero { position: relative; z-index: 5; text-align: center; padding: 4rem 1.25rem 2.5rem; max-width: 780px; margin: 0 auto; }
  .hero-eyebrow { font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; }
  .hero-eyebrow::before, .hero-eyebrow::after { content: ''; display: inline-block; width: 1.5rem; height: 1px; background: var(--gold); opacity: 0.5; }
  .hero-arabic { font-family: 'Lateef', serif; font-size: clamp(2rem, 7vw, 3.5rem); line-height: 1.3; color: var(--teal); margin-bottom: 0.5rem; direction: rtl; }
  .hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.75rem, 5vw, 3rem); font-weight: 300; line-height: 1.25; color: var(--ink); margin-bottom: 1rem; letter-spacing: -0.01em; }
  .hero-title em { font-style: italic; color: var(--gold); font-weight: 400; }
  .hero-sub { font-size: clamp(0.95rem, 2.5vw, 1.1rem); color: var(--muted); font-weight: 300; line-height: 1.7; margin-bottom: 2rem; max-width: 520px; margin-left: auto; margin-right: auto; }

  /* SEARCH */
  .search-container { position: relative; z-index: 5; max-width: 720px; margin: 0 auto 1.25rem; padding: 0 1rem; }
  .search-box { background: white; border: 1.5px solid var(--border); border-radius: 4px; box-shadow: 0 4px 40px var(--shadow); transition: box-shadow 0.3s, border-color 0.3s; }
  .search-box:focus-within { border-color: rgba(200,146,42,0.5); box-shadow: 0 8px 48px rgba(200,146,42,0.12), 0 0 0 3px rgba(200,146,42,0.06); }
  .search-input-row { position: relative; display: flex; align-items: center; }
  .search-input { flex: 1; width: 100%; padding: 1.1rem 4.5rem 1.1rem 1.25rem; font-family: 'Cormorant Garamond', serif; font-size: clamp(1rem, 2.5vw, 1.2rem); font-weight: 300; color: var(--ink); background: transparent; border: none; outline: none; min-width: 0; }
  .search-input::placeholder { color: #b5a898; font-style: italic; }
  .search-btn { position: absolute; right: 0.6rem; background: var(--gold); border: none; cursor: pointer; width: 2.6rem; height: 2.6rem; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1rem; transition: background 0.2s; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
  .search-btn:hover { background: #b07a1e; }
  .search-btn:active { transform: scale(0.96); }

  /* Horizontally scrollable filter row */
  .search-filters { display: flex; gap: 0.4rem; padding: 0.65rem 1.25rem 0.75rem; border-top: 1px solid var(--border); overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; align-items: center; flex-wrap: nowrap; }
  .search-filters::-webkit-scrollbar { display: none; }
  .filter-label { font-size: 0.7rem; color: var(--muted); letter-spacing: 0.05em; white-space: nowrap; margin-right: 0.25rem; flex-shrink: 0; }
  .filter-chip { padding: 0.3rem 0.85rem; white-space: nowrap; flex-shrink: 0; border-radius: 2px; border: 1px solid var(--border); font-family: 'Cormorant Garamond', serif; font-size: 0.82rem; color: var(--muted); background: transparent; cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
  .filter-chip:hover { border-color: var(--gold); color: var(--gold); }
  .filter-chip.active { background: var(--gold); border-color: var(--gold); color: white; }

  /* SUGGESTIONS — horizontally scrollable on mobile */
  .suggestions { position: relative; z-index: 5; max-width: 720px; margin: 0 auto 3rem; padding: 0 1rem; }
  .suggestion-label { font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.65rem; opacity: 0.7; }
  .suggestion-pills { display: flex; gap: 0.45rem; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 4px; flex-wrap: nowrap; }
  .suggestion-pills::-webkit-scrollbar { display: none; }
  .pill { padding: 0.45rem 1rem; flex-shrink: 0; background: white; border: 1px solid var(--border); border-radius: 100px; font-family: 'Cormorant Garamond', serif; font-size: 0.88rem; color: var(--ink); cursor: pointer; transition: all 0.2s; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
  .pill:hover { border-color: var(--teal); color: var(--teal); background: rgba(42,107,107,0.04); }
  .pill:active { transform: scale(0.97); }

  /* SECTIONS */
  .section { position: relative; z-index: 5; max-width: 1100px; margin: 0 auto 3.5rem; padding: 0 1rem; }
  .section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1.25rem; }
  .section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.1rem, 3vw, 1.4rem); font-weight: 400; color: var(--ink); }
  .section-title span { font-family: 'Lateef', serif; font-size: 1.4rem; color: var(--gold); margin-right: 0.35rem; }
  .see-all { font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold); cursor: pointer; white-space: nowrap; text-decoration: none; }

  /* THEME GRID */
  .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
  .theme-card { background: white; border: 1px solid var(--border); border-radius: 3px; padding: 1.25rem; cursor: pointer; transition: all 0.25s; position: relative; overflow: hidden; -webkit-tap-highlight-color: transparent; }
  .theme-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--gold); transform: scaleX(0); transition: transform 0.25s; transform-origin: left; }
  .theme-card:hover { box-shadow: 0 6px 28px var(--shadow); transform: translateY(-2px); border-color: rgba(200,146,42,0.3); }
  .theme-card:hover::before { transform: scaleX(1); }
  .theme-card:active { transform: scale(0.98); }
  .theme-arabic { font-family: 'Lateef', serif; font-size: 1.8rem; color: var(--teal); direction: rtl; margin-bottom: 0.4rem; line-height: 1.2; }
  .theme-name { font-size: 0.92rem; font-weight: 600; color: var(--ink); margin-bottom: 0.2rem; }
  .theme-desc { font-size: 0.8rem; color: var(--muted); line-height: 1.5; font-weight: 300; }
  .theme-count { margin-top: 0.75rem; font-size: 0.72rem; color: var(--gold); letter-spacing: 0.05em; }

  /* VERSE PANEL */
  .verse-panel { background: linear-gradient(135deg, var(--teal) 0%, #1e5050 100%); border-radius: 4px; padding: 2rem 1.75rem; color: white; position: relative; overflow: hidden; }
  .verse-panel::before { content: '﷽'; position: absolute; right: -1rem; top: -2rem; font-family: 'Lateef', serif; font-size: 7rem; opacity: 0.05; color: white; pointer-events: none; line-height: 1; }
  .verse-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.28rem 0.7rem; background: rgba(200,146,42,0.15); border: 1px solid rgba(200,146,42,0.3); border-radius: 100px; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 1rem; }
  .verse-badge::before { content: '✦'; font-size: 0.55rem; }
  .verse-arabic-large { font-family: 'Lateef', serif; font-size: clamp(1.4rem, 4vw, 2.2rem); line-height: 1.6; direction: rtl; margin-bottom: 1rem; color: rgba(255,255,255,0.95); }
  .verse-translation { font-style: italic; font-size: clamp(0.9rem, 2vw, 1.05rem); line-height: 1.7; color: rgba(255,255,255,0.75); font-weight: 300; margin-bottom: 1rem; max-width: 600px; }
  .verse-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 1.25rem; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
  .verse-ref { color: var(--gold-light); font-weight: 600; }
  .verse-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.25rem; }
  .verse-btn { padding: 0.55rem 1.1rem; border: 1px solid rgba(255,255,255,0.25); border-radius: 2px; background: rgba(255,255,255,0.08); color: white; font-family: 'Cormorant Garamond', serif; font-size: 0.88rem; cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
  .verse-btn:hover { background: rgba(255,255,255,0.18); }
  .verse-btn:active { transform: scale(0.97); }
  .verse-btn.primary { background: var(--gold); border-color: var(--gold); }
  .verse-btn.primary:hover { background: #b07a1e; }

  /* TOOLS */
  .tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
  .tool-card { background: white; border: 1px solid var(--border); border-radius: 3px; padding: 1.25rem; cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
  .tool-card:hover { box-shadow: 0 6px 24px var(--shadow); border-color: rgba(200,146,42,0.3); }
  .tool-card:active { transform: scale(0.98); }
  .tool-icon { font-size: 1.4rem; margin-bottom: 0.6rem; }
  .tool-name { font-size: 0.95rem; font-weight: 600; color: var(--ink); margin-bottom: 0.35rem; }
  .tool-desc { font-size: 0.82rem; color: var(--muted); line-height: 1.55; font-weight: 300; }

  /* RESULTS */
  .result-preview { max-width: 720px; margin: 0 auto 2rem; padding: 0 1rem; animation: fadeUp 0.4s ease both; }
  .result-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .result-label { font-size: 0.82rem; color: var(--muted); }
  .result-query { font-size: 0.92rem; font-style: italic; color: var(--ink); }
  .result-clear { margin-left: auto; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 0.78rem; padding: 0.25rem 0.5rem; }
  .result-card { background: white; border: 1px solid var(--border); border-radius: 4px; padding: 1.25rem 1.5rem; margin-bottom: 0.65rem; cursor: pointer; transition: all 0.2s; border-left: 3px solid var(--gold); -webkit-tap-highlight-color: transparent; }
  .result-card:hover { box-shadow: 0 6px 24px var(--shadow); }
  .result-ar { font-family: 'Lateef', serif; font-size: clamp(1.3rem, 4vw, 1.6rem); direction: rtl; color: var(--teal); margin-bottom: 0.5rem; }
  .result-trans { font-size: 0.92rem; font-style: italic; color: var(--ink); line-height: 1.6; margin-bottom: 0.5rem; font-weight: 300; }
  .result-meta { font-size: 0.75rem; color: var(--muted); letter-spacing: 0.06em; display: flex; flex-wrap: wrap; gap: 0.35rem 0.75rem; align-items: center; }
  .result-surah { color: var(--gold); font-weight: 600; }
  .result-tafsir { color: var(--gold); cursor: pointer; }

  /* DIVIDER */
  .divider { display: flex; align-items: center; justify-content: center; gap: 1rem; margin: 0.5rem auto 2.5rem; max-width: 400px; opacity: 0.4; }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--gold); }
  .divider-ornament { color: var(--gold); font-family: 'Lateef', serif; font-size: 1.2rem; }

  /* FOOTER */
  footer { position: relative; z-index: 5; text-align: center; padding: 1.75rem 1rem; border-top: 1px solid var(--border); font-size: 0.78rem; color: var(--muted); letter-spacing: 0.04em; line-height: 1.6; }
  .footer-arabic { font-family: 'Lateef', serif; font-size: 1.1rem; color: var(--gold); margin-bottom: 0.4rem; }

  /* MOBILE BOTTOM BAR */
  .mobile-bar { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 80; background: rgba(250,247,242,0.97); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid var(--border); padding: 0.55rem 0 calc(0.55rem + env(safe-area-inset-bottom, 0px)); }
  .mobile-bar-inner { display: flex; justify-content: space-around; align-items: center; }
  .bar-btn { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; cursor: pointer; font-family: 'Cormorant Garamond', serif; font-size: 0.62rem; letter-spacing: 0.05em; color: var(--muted); padding: 0.3rem 0.6rem; -webkit-tap-highlight-color: transparent; transition: color 0.2s; min-width: 56px; }
  .bar-btn.active { color: var(--gold); }
  .bar-btn-icon { font-size: 1.15rem; line-height: 1; }

  /* ANIMATIONS */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  .animate-1 { animation: fadeUp 0.6s ease both; }
  .animate-2 { animation: fadeUp 0.6s ease 0.1s both; }
  .animate-3 { animation: fadeUp 0.6s ease 0.2s both; }
  .animate-4 { animation: fadeUp 0.6s ease 0.3s both; }
  .animate-5 { animation: fadeUp 0.6s ease 0.4s both; }

  /* ─── RESPONSIVE ─── */

  @media (max-width: 900px) {
    header { padding: 0 1.5rem; }
    .desktop-nav a:not(.nav-cta) { display: none; }
    .tools-grid { gap: 0.6rem; }
  }

  @media (max-width: 640px) {
    :root { --header-h: 56px; }

    /* Header */
    header { padding: 0 1rem; }
    .desktop-nav { display: none; }
    .hamburger { display: flex; }

    /* Hero: compact */
    .hero { padding: 2.25rem 1rem 1.5rem; }
    .hero-sub { font-size: 0.93rem; }

    /* Search */
    .search-container { padding: 0 0.75rem; }
    .search-input { padding: 0.9rem 3.75rem 0.9rem 1rem; }
    .search-btn { width: 2.4rem; height: 2.4rem; right: 0.5rem; }
    .search-filters { padding: 0.55rem 0.75rem 0.6rem; }

    /* Suggestions */
    .suggestions { padding: 0 0.75rem; margin-bottom: 2rem; }

    /* Sections */
    .section { padding: 0 0.75rem; margin-bottom: 2.5rem; }

    /* Theme: 2-col compact */
    .theme-grid { grid-template-columns: repeat(2, 1fr); gap: 0.55rem; }
    .theme-card { padding: 0.9rem; }
    .theme-arabic { font-size: 1.6rem; }
    .theme-desc { display: none; }

    /* Verse panel */
    .verse-panel { padding: 1.4rem 1.1rem; }
    .verse-panel::before { font-size: 4.5rem; }
    .verse-actions { gap: 0.45rem; }
    .verse-btn { font-size: 0.8rem; padding: 0.48rem 0.85rem; }

    /* Tools: row layout (icon + text side-by-side) */
    .tools-grid { grid-template-columns: 1fr; gap: 0.55rem; }
    .tool-card { display: flex; align-items: flex-start; gap: 0.85rem; padding: 1rem; }
    .tool-icon { font-size: 1.2rem; margin-bottom: 0; flex-shrink: 0; margin-top: 2px; }

    /* Results */
    .result-preview { padding: 0 0.75rem; }
    .result-card { padding: 1rem; }
    .result-meta { gap: 0.3rem 0.5rem; }
    .result-tafsir { margin-left: 0; }

    /* Show mobile bar */
    .mobile-bar { display: block; }
    .page { padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px)); }
    footer { padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px)); }
  }

  @media (max-width: 380px) {
    .hero-arabic { font-size: 1.7rem; }
    .verse-actions { flex-direction: column; }
    .verse-btn { text-align: center; width: 100%; }
    .theme-grid { gap: 0.45rem; }
  }
`;

const themeCategories = [
  { arabic: "الإيمان", name: "Faith & Belief", desc: "Tawhid, pillars of iman, certainty", count: "312 verses" },
  { arabic: "الرحمة", name: "Mercy & Forgiveness", desc: "Allah's mercy, repentance, hope", count: "248 verses" },
  { arabic: "الآخرة", name: "The Hereafter", desc: "Judgment, paradise, accountability", count: "396 verses" },
  { arabic: "الدعوة", name: "Da'wah Methods", desc: "Calling to Islam with wisdom", count: "87 verses" },
  { arabic: "الأخلاق", name: "Character & Ethics", desc: "Manners, truthfulness, justice", count: "203 verses" },
  { arabic: "الصبر", name: "Patience & Resilience", desc: "Sabr, gratitude, trials", count: "90 verses" },
];

const suggestions = [
  "Invite non-Muslims gently",
  "Verses on Tawhid",
  "Kindness in the Qur'an",
  "Why shirk is forbidden",
  "Purpose of human creation",
  "Signs of Judgment Day",
];

const tools = [
  { icon: "🔗", name: "Thematic Explorer", desc: "Map connections between related Qur'anic themes across surahs." },
  { icon: "📖", name: "Tafsir Comparator", desc: "Compare classical and contemporary scholars side by side." },
  { icon: "🗣️", name: "Da'wah Builder", desc: "Compose topic-based presentations with supporting verses and context." },
];

const mockResults = [
  {
    ar: "ادْعُ إِلَىٰ سَبِيلِ رَبِّكَ بِالْحِكْمَةِ وَالْمَوْعِظَةِ الْحَسَنَةِ",
    trans: "Invite to the way of your Lord with wisdom and good instruction, and argue with them in a way that is best.",
    surah: "An-Nahl 16:125",
    theme: "Da'wah methodology",
  },
  {
    ar: "وَمَنْ أَحْسَنُ قَوْلًا مِّمَّن دَعَا إِلَى اللَّهِ وَعَمِلَ صَالِحًا",
    trans: "And who is better in speech than one who invites to Allah and does righteousness and says, 'Indeed, I am of the Muslims.'",
    surah: "Fussilat 41:33",
    theme: "Excellence of the caller to Islam",
  },
];

const filters = ["All Sources", "Verses", "Tafsir", "Thematic", "Da'wah Focus"];
const navLinks = ["Explore", "Surahs", "Scholars", "About"];
const barItems = [
  { icon: "🔍", label: "Search" },
  { icon: "📚", label: "Themes" },
  { icon: "🕌", label: "Surahs" },
  { icon: "🗣️", label: "Da'i" },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Sources");
  const [showResults, setShowResults] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBar, setActiveBar] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 640) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleSearch = (q) => {
    const val = (q !== undefined ? q : query).trim();
    if (val) { setQuery(val); setShowResults(true); setMenuOpen(false); }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="bg-texture" />
        <div className="noise" />

        {/* Header */}
        <header>
          <a className="logo" href="#">
            <div className="logo-mark">ق</div>
            <div className="logo-text">Qur'an<span>Insight</span></div>
          </a>
          <nav className="desktop-nav">
            {navLinks.map(l => <a key={l} href="#">{l}</a>)}
            <a href="#" className="nav-cta">For Da'i</a>
          </nav>
          <button className={`hamburger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </header>

        {/* Mobile drawer */}
        <div className={`mobile-nav ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
          {navLinks.map(l => <a key={l} href="#" onClick={() => setMenuOpen(false)}>{l}</a>)}
          <a href="#" className="mobile-nav-cta" onClick={() => setMenuOpen(false)}>For Da'i →</a>
        </div>

        {/* Hero */}
        <div className="hero animate-1">
          <div className="hero-eyebrow">Intelligent Qur'anic Knowledge</div>
          <div className="hero-arabic">ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ</div>
          <h1 className="hero-title">Explore the Qur'an with<br /><em>depth and clarity</em></h1>
          <p className="hero-sub">
            A semantic knowledge platform for da'wah. Search verses, uncover thematic connections,
            and build understanding rooted in authentic tafsir.
          </p>
        </div>

        {/* Search */}
        <div className="search-container animate-2">
          <div className="search-box">
            <div className="search-input-row">
              <input
                ref={inputRef}
                className="search-input"
                placeholder="Ask a question, theme, or Arabic phrase…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button className="search-btn" onClick={() => handleSearch()} aria-label="Search">⟶</button>
            </div>
            <div className="search-filters">
              <span className="filter-label">Focus:</span>
              {filters.map(f => (
                <button key={f} className={`filter-chip ${activeFilter === f ? "active" : ""}`} onClick={() => setActiveFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {!showResults && (
          <div className="suggestions animate-3">
            <div className="suggestion-label">Try asking</div>
            <div className="suggestion-pills">
              {suggestions.map(s => (
                <button key={s} className="pill" onClick={() => handleSearch(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="result-preview">
            <div className="result-header">
              <span className="result-label">Results for:</span>
              <span className="result-query">"{query}"</span>
              <button className="result-clear" onClick={() => { setShowResults(false); setQuery(""); }}>✕ Clear</button>
            </div>
            {mockResults.map((r, i) => (
              <div key={i} className="result-card">
                <div className="result-ar">{r.ar}</div>
                <div className="result-trans">{r.trans}</div>
                <div className="result-meta">
                  <span className="result-surah">{r.surah}</span>
                  <span>Theme: {r.theme}</span>
                  <span className="result-tafsir">Explore tafsir →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Home content */}
        {!showResults && (
          <>
            <div className="section animate-4">
              <div className="section-header">
                <div className="section-title"><span>❖</span> Explore by Theme</div>
                <span className="see-all">View all →</span>
              </div>
              <div className="theme-grid">
                {themeCategories.map(t => (
                  <div key={t.name} className="theme-card">
                    <div className="theme-arabic">{t.arabic}</div>
                    <div className="theme-name">{t.name}</div>
                    <div className="theme-desc">{t.desc}</div>
                    <div className="theme-count">{t.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section animate-5">
              <div className="section-header">
                <div className="section-title"><span>✦</span> Verse of the Day</div>
              </div>
              <div className="verse-panel">
                <div className="verse-badge">Al-Baqarah 2:256</div>
                <div className="verse-arabic-large">لَآ إِكْرَاهَ فِى ٱلدِّينِ ۖ قَد تَّبَيَّنَ ٱلرُّشْدُ مِنَ ٱلْغَىِّ</div>
                <div className="verse-translation">"There shall be no compulsion in religion. The right course has become clear from the wrong."</div>
                <div className="verse-meta">
                  <span className="verse-ref">Surah Al-Baqarah · Ayah 256</span>
                  <span>Juz 3</span>
                  <span>Madani</span>
                </div>
                <div className="verse-actions">
                  <button className="verse-btn primary">Read Full Tafsir</button>
                  <button className="verse-btn">Related Verses</button>
                  <button className="verse-btn">Use in Da'wah</button>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <div className="section-title"><span>⟐</span> Scholar's Toolkit</div>
              </div>
              <div className="tools-grid">
                {tools.map(t => (
                  <div key={t.name} className="tool-card">
                    <div className="tool-icon">{t.icon}</div>
                    <div>
                      <div className="tool-name">{t.name}</div>
                      <div className="tool-desc">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider"><div className="divider-ornament">﷽</div></div>
          </>
        )}

        <footer>
          <div className="footer-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          Built for seekers of knowledge · Qur'anInsight © 1446H<br />
          Data sourced from authenticated Qur'anic corpus
        </footer>

        {/* Mobile bottom nav */}
        <div className="mobile-bar">
          <div className="mobile-bar-inner">
            {barItems.map((b, i) => (
              <button
                key={b.label}
                className={`bar-btn ${activeBar === i ? "active" : ""}`}
                onClick={() => { setActiveBar(i); if (i === 0 && inputRef.current) inputRef.current.focus(); }}
              >
                <span className="bar-btn-icon">{b.icon}</span>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
