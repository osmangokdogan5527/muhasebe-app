import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DialogHost } from './components/common/DialogHost';
import './index.css';
import './styles/pusula.css';
import './styles/layout.css';
import './styles/sivimesh.css';
import { registerServiceWorker } from './utils/pwa';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <DialogHost />
    </ErrorBoundary>
  </StrictMode>,
);
