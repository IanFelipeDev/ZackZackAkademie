import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { createContainer, createSupabaseAdapters } from './app/container';
import { Providers } from './app/providers';
import { routes } from './app/routes';
import { createSupabaseClient } from './shared/infrastructure/supabase/client';
import './index.css';

const container = createContainer(createSupabaseAdapters(createSupabaseClient()));
const router = createBrowserRouter(routes);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element');

createRoot(rootElement).render(
  <StrictMode>
    <Providers container={container}>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
