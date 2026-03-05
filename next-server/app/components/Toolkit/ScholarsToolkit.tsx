'use client';

import React from 'react';

interface ToolItem {
  icon: string;
  name: string;
  desc: string;
}

const tools: ToolItem[] = [
  { icon: '🔗', name: 'Thematic Explorer', desc: "Map connections between related Qur'anic themes across surahs." },
  { icon: '📖', name: 'Tafsir Comparator', desc: 'Compare classical and contemporary scholars side by side.' },
  { icon: '🗣️', name: "Da'wah Builder", desc: 'Compose topic-based presentations with supporting verses and context.' },
];

export function ScholarsToolkit() {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title"><span>⟐</span> Scholar&apos;s Toolkit</div>
      </div>
      <div className="tools-grid">
        {tools.map((tool) => (
          <div key={tool.name} className="tool-card">
            <div className="tool-icon">{tool.icon}</div>
            <div className="tool-name">{tool.name}</div>
            <div className="tool-desc">{tool.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
