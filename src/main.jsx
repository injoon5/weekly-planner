import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import './styles/palette.css';
import './styles/base-ui.css';
import { bootDocumentTheme } from './theme/theme-dom.js';
import { App } from './router.jsx';

bootDocumentTheme();

// Service worker registration + refresh prompt live in <RefreshBanner />
// (virtual:pwa-register/react) so a new deployment can show a dismissable banner.

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
