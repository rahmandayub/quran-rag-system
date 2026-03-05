'use client';

import React, { ChangeEvent } from 'react';
import Link from 'next/link';

interface FormOptionsProps {
  rememberMe?: boolean;
  onRememberMeChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  forgotPasswordLink?: string;
  termsLabel?: React.ReactNode;
}

export function FormOptions({
  rememberMe,
  onRememberMeChange,
  forgotPasswordLink,
  termsLabel,
}: FormOptionsProps) {
  if (termsLabel) {
    return (
      <div className="form-group">
        <label className="checkbox-wrapper" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <input
            type="checkbox"
            onChange={onRememberMeChange}
            style={{ marginTop: '0.2rem' }}
          />
          <span>{termsLabel}</span>
        </label>
      </div>
    );
  }

  return (
    <div className="form-options">
      {rememberMe !== undefined && onRememberMeChange && (
        <label className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={onRememberMeChange}
          />
          Remember me
        </label>
      )}
      {forgotPasswordLink && (
        <Link href={forgotPasswordLink} className="forgot-link">
          Forgot password?
        </Link>
      )}
    </div>
  );
}
