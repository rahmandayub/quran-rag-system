'use client';

import React from 'react';

interface SocialLoginProps {
  onSocialLogin: (provider: string) => void;
  disabled?: boolean;
  providers?: { name: string; icon: string; label: string }[];
}

const defaultProviders = [
  { name: 'google', icon: 'G', label: 'Google' },
  { name: 'github', icon: '◈', label: 'GitHub' },
];

export function SocialLogin({
  onSocialLogin,
  disabled = false,
  providers = defaultProviders,
}: SocialLoginProps) {
  return (
    <div className="social-buttons">
      {providers.map((provider) => (
        <button
          key={provider.name}
          className="social-btn"
          onClick={() => onSocialLogin(provider.name)}
          disabled={disabled}
        >
          <span className="social-icon">{provider.icon}</span>
          {provider.label}
        </button>
      ))}
    </div>
  );
}
