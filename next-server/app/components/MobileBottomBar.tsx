'use client';

import React from 'react';
import type { NavItem } from './types';

interface MobileBottomBarProps {
  barItems: NavItem[];
  activeBar: number;
  setActiveBar: (index: number) => void;
}

export function MobileBottomBar({ barItems, activeBar, setActiveBar }: MobileBottomBarProps) {
  return (
    <div className="mobile-bar">
      <div className="mobile-bar-inner">
        {barItems.map((item, index) => (
          <button
            key={item.label}
            className={`bar-btn ${activeBar === index ? 'active' : ''}`}
            onClick={() => setActiveBar(index)}
          >
            <span className="bar-btn-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
