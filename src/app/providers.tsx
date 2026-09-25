import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/presentation';
import type { Container } from './container';
import { ContainerProvider } from './context/container-context';
import { createQueryClient } from './query-client';

interface ProvidersProps {
  readonly container: Container;
  readonly queryClient?: QueryClient;
  readonly children: ReactNode;
}

export function Providers({ container, queryClient, children }: ProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <ContainerProvider container={container}>
        <AuthProvider>{children}</AuthProvider>
      </ContainerProvider>
    </QueryClientProvider>
  );
}
