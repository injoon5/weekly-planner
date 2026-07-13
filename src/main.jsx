import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './app.css';
import './styles/palette.css';
import './styles/base-ui.css';
import { bootDocumentTheme } from './theme-dom.js';
import { App } from './router.jsx';

bootDocumentTheme();

registerSW({ immediate: true });

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
