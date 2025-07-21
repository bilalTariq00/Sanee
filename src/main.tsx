import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n'; // <--- Import this
import { Toaster } from 'sonner';
import { UnreadProvider } from './contexts/UnreadContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <Toaster richColors position="top-center" />
    <UnreadProvider>
    <App />
    </UnreadProvider>
  </StrictMode>
);
