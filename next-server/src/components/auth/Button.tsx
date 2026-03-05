'use client';

import React from 'react';

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'social';
  className?: string;
}

export function Button({
  type = 'button',
  onClick,
  disabled = false,
  isLoading = false,
  children,
  variant = 'primary',
  className,
}: ButtonProps) {
  const baseClasses = variant === 'social' ? 'social-btn' : 'submit-btn';
  const classes = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
