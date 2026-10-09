import { QueryClient } from '@tanstack/react-query';

// Online-first: reads are cached for fast reloads and short outages; writes always hit the server.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});
