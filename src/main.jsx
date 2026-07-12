import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import './styles/palette.css';
import { bootDocumentTheme } from './theme-dom.js';
import { App } from './router.jsx';

bootDocumentTheme();

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
