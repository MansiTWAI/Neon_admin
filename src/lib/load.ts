import 'server-only';
import { ApiError } from '@neon-adda/shared/web/server';
import { notFound } from 'next/navigation';
import { serverApi } from './server-api';

export const FORBIDDEN = Symbol('forbidden');

/**
 * Loads a page's data. A 404 renders the not-found page; a 403 is returned as FORBIDDEN so the
 * page can explain which permission is missing instead of failing.
 */
export async function load<T>(path: string): Promise<T | typeof FORBIDDEN> {
  try {
    return await serverApi.request<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return FORBIDDEN;
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
}

/** Builds a query string from defined values only. */
export function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
  return search.size ? `?${search}` : '';
}
