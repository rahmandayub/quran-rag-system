'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthContainer,
  AuthTitle,
  AuthSubtitle,
  AuthForm,
  AuthFooter,
  FormError,
  TextInput,
  PasswordInput,
  FormOptions,
  Button,
  Divider,
  SocialLogin,
} from '@/components/auth';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Failed to sign in');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleRememberMeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
  };

  return (
    <AuthContainer>
      <AuthTitle title="Welcome Back" />
      <AuthSubtitle subtitle="Continue your knowledge journey" />

      <FormError message={error} />

      <AuthForm onSubmit={handleSubmit}>
        <TextInput
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={handleEmailChange}
          required
          disabled={isLoading}
        />

        <PasswordInput
          id="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={handlePasswordChange}
          required
          disabled={isLoading}
        />

        <FormOptions
          rememberMe={rememberMe}
          onRememberMeChange={handleRememberMeChange}
          forgotPasswordLink="/auth/forgot-password"
        />

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </AuthForm>

      <Divider text="or continue with" />

      <SocialLogin
        onSocialLogin={handleSocialLogin}
        disabled={isLoading}
      />

      <AuthFooter
        message="Don't have an account?"
        linkText="Sign Up →"
        linkHref="/auth/signup"
      />
    </AuthContainer>
  );
}
