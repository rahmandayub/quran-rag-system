'use client';

import React, { FormEvent } from 'react';

interface AuthFormProps {
  onSubmit: (e: FormEvent) => void;
  children: React.ReactNode;
}

export function AuthForm({ onSubmit, children }: AuthFormProps) {
  return (
    <form onSubmit={onSubmit}>
      {children}
    </form>
  );
}
