'use client';

import React, { ChangeEvent } from 'react';

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  label?: React.ReactNode;
}

export function Checkbox({
  id,
  checked,
  onChange,
  disabled = false,
  label,
}: CheckboxProps) {
  return (
    <label className="checkbox-wrapper" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ marginTop: '0.2rem' }}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
