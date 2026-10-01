import type { PricingRules } from '@neon-adda/shared';
import { API_URL } from './env';

export async function fetchPublishedRateCard(): Promise<PricingRules | null> {
  try {
    const res = await fetch(`${API_URL}/v1/pricing/rate-card/current`, { cache: 'no-store' });
    return res.ok ? ((await res.json()) as PricingRules) : null;
  } catch {
    return null;
  }
}

export interface StudioAssets {
  fonts: { family: string; name: string }[];
  colors: { name: string; glowHex: string; tubeHex: string }[];
  backboards: { code: string; name: string }[];
}

/** Fonts, colours and backboards customers can pick from, for the product editor. */
export async function fetchStudioAssets(): Promise<StudioAssets> {
  const res = await fetch(`${API_URL}/v1/studio/assets`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Studio assets failed with ${res.status}`);
  return (await res.json()) as StudioAssets;
}
