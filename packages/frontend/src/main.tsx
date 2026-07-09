import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider } from './lib/auth';
import { registerServiceWorker } from './lib/pwa';
import './lib/i18n';
import './index.css';

// Installable PWA: register the service worker (production builds only).
registerServiceWorker();

// Own scroll position ourselves so reloads/back-forward never reopen a long
// page scrolled to the bottom (ScrollToTop resets to the top on route changes).
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { borderRadius: '12px', background: '#18181b', color: '#fff', fontSize: '14px' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
