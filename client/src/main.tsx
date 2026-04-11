import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 🛑 SERVICE WORKER KILL-SWITCH (Fixes persistent CSS/Caching issues)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('[SW] Unregistered successfully');
    }
  });
  
  // Also clear caches to ensure fresh assets
  caches.keys().then((names) => {
    for (const name of names) caches.delete(name);
  });
}
