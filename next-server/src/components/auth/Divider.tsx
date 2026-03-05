import React from 'react';

interface DividerProps {
  text?: string;
}

export function Divider({ text = 'or continue with' }: DividerProps) {
  return (
    <div className="divider">{text}</div>
  );
}
