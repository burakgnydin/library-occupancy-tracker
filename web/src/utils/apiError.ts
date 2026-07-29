import { isAxiosError } from 'axios';

import type { ApiErrorResponse } from '../types/auth';

const RATE_LIMIT_MESSAGE = 'Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.';

// mobile/src/utils/apiError.ts ile birebir ayni mantik - backend'in hata
// govdesi ({ message }) her iki istemcide de ayni sekilde geliyor.
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Bir hata oluştu. Lütfen tekrar deneyin.',
): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    if (error.response?.status === 429) {
      return RATE_LIMIT_MESSAGE;
    }
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}
