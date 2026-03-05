'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
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
  Button,
  Divider,
  SocialLogin,
} from '@/components/auth';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the Terms and Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/auth/signin?registered=true');
      } else {
        setError(data.error || 'Failed to create account');
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

  const handleAgreeToTermsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAgreeToTerms(e.target.checked);
  };

  return (
    <AuthContainer>
      <AuthTitle title="Create Account" />
      <AuthSubtitle subtitle="Start your knowledge journey" />

      <FormError message={error} />

      <AuthForm onSubmit={handleSubmit}>
        <TextInput
          id="name"
          label="Full Name"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange}
          name="name"
          required
          disabled={isLoading}
        />

        <TextInput
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          name="email"
          required
          disabled={isLoading}
        />

        <PasswordInput
          id="password"
          label="Password"
          placeholder="At least 8 characters"
          value={formData.password}
          onChange={handleChange}
          name="password"
          required
          disabled={isLoading}
          minLength={8}
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          name="confirmPassword"
          required
          disabled={isLoading}
        />

        <div className="form-group">
          <label className="checkbox-wrapper" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={handleAgreeToTermsChange}
              disabled={isLoading}
              style={{ marginTop: '0.2rem' }}
            />
            <span>I agree to the <Link href="/terms" className="forgot-link">Terms of Service</Link> and <Link href="/privacy" className="forgot-link">Privacy Policy</Link></span>
          </label>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </AuthForm>

      <Divider text="or sign up with" />

      <SocialLogin
        onSocialLogin={handleSocialLogin}
        disabled={isLoading}
      />

      <AuthFooter
        message="Already have an account?"
        linkText="Sign In →"
        linkHref="/auth/signin"
      />
    </AuthContainer>
  );
}
