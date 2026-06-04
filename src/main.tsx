import {StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache standard queries for 5 minutes
      gcTime: 1000 * 60 * 10,   // Keep unused query garbage collected after 10 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevent jarring background refetches
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center font-mono text-center px-4" id="vuu-i18n-loader">
          <span className="w-9 h-9 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-3"></span>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-extrabold font-mono">VUU Transport</span>
          <span className="text-[10px] text-slate-500 mt-1">Initializing multilingual registers...</span>
        </div>
      }>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
);
