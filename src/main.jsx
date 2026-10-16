import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'katex/dist/katex.min.css'
import App from './App.jsx'

// Automatically recover from chunk mismatches caused by new production deployments
window.addEventListener('vite:preloadError', (event) => {
  if (typeof event?.preventDefault === 'function') {
    event.preventDefault();
  }
  const lastReload = parseInt(sessionStorage.getItem('last_chunk_reload') || '0', 10);
  const now = Date.now();
  if (now - lastReload > 10000) {
    sessionStorage.setItem('last_chunk_reload', now.toString());
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
