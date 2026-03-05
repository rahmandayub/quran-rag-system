'use client';

import React from 'react';

interface MobileNavProps {
  menuOpen: boolean;
  onNavClick: () => void;
}

const navLinks = ['Explore', 'Surahs', 'Scholars', 'About'];

export function MobileNav({ menuOpen, onNavClick }: MobileNavProps) {
  return (
    <div className={`mobile-nav ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
      {navLinks.map((link) => (
        <a key={link} href="#" onClick={onNavClick}>{link}</a>
      ))}
      <a href="#" className="mobile-nav-cta" onClick={onNavClick}>For Da&apos;i &rarr;</a>
    </div>
  );
}
