import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Register Service Worker with automatic update check
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registered!', reg);
        // Force check for fresh build on every load
        reg.update();
      })
      .catch(err => console.log('Service Worker registration failed:', err));
  });

  // Reload page when new service worker takes over
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

