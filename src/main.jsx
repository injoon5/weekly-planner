import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import './styles/palette.css';
import { App } from './router.jsx';

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
