import React from 'react';

interface AuthSubtitleProps {
  subtitle: string;
}

export function AuthSubtitle({ subtitle }: AuthSubtitleProps) {
  return (
    <p className="auth-subtitle">{subtitle}</p>
  );
}
