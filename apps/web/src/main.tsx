import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/press-start-2p/400.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('index.html has no #root to mount into');
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
