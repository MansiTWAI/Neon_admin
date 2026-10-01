'use client';

import { ApiError } from '@neon-adda/shared/web/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from './browser-api';

export interface ActionState {
  pending: boolean;
  error: string | null;
  /** The API's stable error code, for callers that offer a way out of a specific problem. */
  code: string | null;
  fieldErrors: Record<string, string>;
}

/**
 * Runs an API call from a form or button, keeps its pending and error state, and refreshes the
 * server-rendered page afterwards so lists and totals show the change.
 */
export function useAction() {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({
    pending: false,
    error: null,
    code: null,
    fieldErrors: {},
  });

  async function run<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T | null> {
    setState({ pending: true, error: null, code: null, fieldErrors: {} });
    const { json, ...rest } = init;
    try {
      const result = await api.request<T>(path, {
        method: 'POST',
        ...rest,
        ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
      });
      setState({ pending: false, error: null, code: null, fieldErrors: {} });
      router.refresh();
      // 204 responses have no body; success must still read as truthy to callers.
      return result ?? ({} as T);
    } catch (error) {
      const problem = error instanceof ApiError ? error : null;
      const errors = (problem?.details.errors ?? []) as { field: string; message: string }[];
      setState({
        pending: false,
        error: problem
          ? errors.length
            ? 'Check the highlighted fields'
            : problem.title
          : 'Could not reach the server',
        code: problem?.code ?? null,
        fieldErrors: Object.fromEntries(errors.map((e) => [e.field, e.message])),
      });
      return null;
    }
  }

  const reset = () => setState({ pending: false, error: null, code: null, fieldErrors: {} });
  return { ...state, run, reset };
}
