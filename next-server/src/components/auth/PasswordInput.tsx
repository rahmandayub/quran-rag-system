'use client';

import React, { ChangeEvent, useState } from 'react';

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  minLength?: number;
  showStrength?: boolean;
}

export function PasswordInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  name,
  minLength,
  showStrength = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="password-input-wrapper">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          minLength={minLength}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          disabled={disabled}
        >
          {showPassword ? '👁' : '👁‍🗨'}
        </button>
      </div>
      {showStrength && value && (
        <div className="password-strength">
          {getStrengthLabel(value)}
        </div>
      )}
    </div>
  );
}

function getStrengthLabel(password: string): string {
  const length = password.length;
  if (length < 6) return 'Weak';
  if (length < 10) return 'Medium';
  return 'Strong';
}
