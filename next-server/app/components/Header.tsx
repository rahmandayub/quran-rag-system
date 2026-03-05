'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const navLinks = ['Explore', 'Surahs', 'Scholars', 'About'];

export function Header({ menuOpen, setMenuOpen }: HeaderProps) {
  return (
    <header>
      <a className="logo" href="#">
        <div className="logo-mark">ق</div>
        <div className="logo-text">Qur&apos;an<span>Insight</span></div>
      </a>
      <nav className="desktop-nav">
        {navLinks.map((link) => (
          <a key={link} href="#">{link}</a>
        ))}
        <Link href="/auth/signin" className="nav-login">
          Log In
        </Link>
        <Link href="/auth/signup" className="nav-cta">
          For Da&apos;i
        </Link>
      </nav>
      <button
        className={`hamburger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>
    </header>
  );
}
