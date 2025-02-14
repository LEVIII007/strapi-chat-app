import { cookies } from 'next/headers';

const COOKIE_NAME = 'auth-token';

export const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

export function setAuthToken(token: string): void {
  cookies().set(COOKIE_NAME, token, cookieConfig);
}

export function getAuthToken(): string | null {
  const cookie = cookies().get(COOKIE_NAME);
  return cookie?.value || null;
}

export function clearAuthToken(): void {
  cookies().delete(COOKIE_NAME);
} 