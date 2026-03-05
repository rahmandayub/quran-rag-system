import React from 'react';

interface AuthTitleProps {
  title: string;
}

export function AuthTitle({ title }: AuthTitleProps) {
  return (
    <h1 className="auth-title">{title}</h1>
  );
}
