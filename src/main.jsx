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

const PROD_HOST = 'plan.ij5.dev';

async function start() {
  // Toolbar on preview/local only — keep production host clean.
  if (typeof location !== 'undefined' && location.hostname !== PROD_HOST) {
    const { scan } = await import('react-scan/all-environments');
    scan({ enabled: true, showToolbar: true });
  }

  createRoot(document.getElementById('app')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
