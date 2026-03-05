import React from 'react';
import Link from 'next/link';

interface AuthFooterProps {
  message: string;
  linkText: string;
  linkHref: string;
}

export function AuthFooter({ message, linkText, linkHref }: AuthFooterProps) {
  return (
    <p className="auth-footer">
      {message}{' '}
      <Link href={linkHref}>{linkText}</Link>
    </p>
  );
}
