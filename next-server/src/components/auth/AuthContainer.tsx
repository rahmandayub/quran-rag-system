import React from 'react';

interface AuthContainerProps {
  children: React.ReactNode;
}

export function AuthContainer({ children }: AuthContainerProps) {
  return (
    <div className="auth-container">
      {children}
    </div>
  );
}
