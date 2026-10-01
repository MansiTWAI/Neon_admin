import type { Metadata } from 'next';
import { PasswordSignIn } from '@/components/auth/password-sign-in';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only same-site paths: "//host" and "/\host" would send the user to another site after signing in.
  const destination = next && /^\/(?![/\\])/.test(next) ? next : '/';
  return <PasswordSignIn next={destination} />;
}
