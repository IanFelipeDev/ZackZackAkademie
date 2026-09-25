import { QueryClient } from '@tanstack/react-query';

const MAX_QUERY_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: MAX_QUERY_RETRIES, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });
}
