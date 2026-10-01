import { createBrowserApi } from '@neon-adda/shared/web/client';
import { API_URL } from './env';

export const api = createBrowserApi('admin', API_URL);
