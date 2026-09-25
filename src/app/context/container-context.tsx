import { createContext, useContext, type ReactNode } from 'react';
import type { Container } from '../container';

const ContainerContext = createContext<Container | null>(null);

export function ContainerProvider({ container, children }: { container: Container; children: ReactNode }) {
  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>;
}

/** Gives presentation code access to use cases without importing infrastructure. */
// eslint-disable-next-line react-refresh/only-export-components
export function useContainer(): Container {
  const container = useContext(ContainerContext);
  if (!container) throw new Error('useContainer must be used inside <ContainerProvider>');
  return container;
}
