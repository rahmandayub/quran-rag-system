'use client';

import React from 'react';

export function Footer() {
  return (
    <footer>
      <div className="footer-arabic">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
      <div>QuranInsight &copy; {new Date().getFullYear()} — Built for seekers of knowledge</div>
    </footer>
  );
}
