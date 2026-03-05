'use client';

import Link from 'next/link';

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
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--warm-white);
    color: var(--ink);
    font-family: 'Cormorant Garamond', serif;
    min-height: 100vh;
  }

  .auth-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

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

  /* Header */
  .auth-header {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem 2rem;
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

  /* Main content */
  .auth-main {
    position: relative; z-index: 5;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }

  .auth-container {
    width: 100%;
    max-width: 440px;
    background: white;
    border: 1px solid var(--border);
    border-radius: 4px;
    box-shadow: 0 4px 40px var(--shadow);
    padding: 2.5rem 2rem;
  }

  .auth-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.75rem;
    font-weight: 400;
    text-align: center;
    margin-bottom: 0.5rem;
    color: var(--ink);
  }

  .auth-subtitle {
    font-size: 0.95rem;
    color: var(--muted);
    text-align: center;
    margin-bottom: 2rem;
    font-weight: 300;
  }

  /* Form styles */
  .form-group { margin-bottom: 1.25rem; }

  .form-label {
    display: block;
    font-size: 0.82rem;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.4rem;
    text-transform: uppercase;
  }

  .form-input {
    width: 100%;
    padding: 0.85rem 1rem;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem;
    color: var(--ink);
    background: var(--warm-white);
    border: 1px solid var(--border);
    border-radius: 2px;
    transition: all 0.2s;
    outline: none;
  }

  .form-input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(200,146,42,0.06);
  }

  .form-input::placeholder { color: #b5a898; font-style: italic; }

  .password-input-wrapper { position: relative; }

  .password-toggle {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--muted);
    font-size: 1.1rem;
    padding: 0.25rem;
    transition: color 0.2s;
  }

  .password-toggle:hover { color: var(--gold); }

  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    font-size: 0.85rem;
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--muted);
    cursor: pointer;
  }

  .checkbox-wrapper input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--gold);
  }

  .forgot-link {
    color: var(--gold);
    text-decoration: none;
    transition: color 0.2s;
  }

  .forgot-link:hover { color: var(--teal); }

  .form-error {
    background: rgba(180, 50, 50, 0.08);
    border: 1px solid rgba(180, 50, 50, 0.2);
    color: #8b2d2d;
    padding: 0.75rem 1rem;
    border-radius: 2px;
    font-size: 0.88rem;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-error::before { content: '⚠'; }

  .submit-btn {
    width: 100%;
    padding: 0.95rem;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: white;
    background: var(--gold);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
  }

  .submit-btn:hover {
    background: #b07a1e;
  }

  .submit-btn:active {
    transform: scale(0.98);
  }

  .submit-btn:disabled {
    background: var(--muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Divider */
  .divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* Social buttons */
  .social-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.9rem;
    color: var(--ink);
    background: white;
    border: 1px solid var(--border);
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .social-btn:hover {
    border-color: var(--gold);
    background: rgba(200,146,42,0.04);
  }

  .social-btn:active {
    transform: scale(0.98);
  }

  .social-icon {
    font-size: 1.2rem;
  }

  /* Auth footer */
  .auth-footer {
    text-align: center;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .auth-footer a {
    color: var(--gold);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .auth-footer a:hover {
    color: var(--teal);
  }

  /* Responsive */
  @media (max-width: 480px) {
    .auth-container {
      padding: 2rem 1.5rem;
    }

    .social-buttons {
      grid-template-columns: 1fr;
    }
  }
`;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{styles}</style>
      <div className="auth-page">
        <div className="bg-texture" />
        <div className="noise" />
        
        <header className="auth-header">
          <Link href="/" className="logo">
            <div className="logo-mark">ق</div>
            <div className="logo-text">Qur&apos;an<span>Insight</span></div>
          </Link>
        </header>

        <main className="auth-main">
          {children}
        </main>
      </div>
    </>
  );
}
