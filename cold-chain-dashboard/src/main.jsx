import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { MonitorProvider } from './context/MonitorContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MonitorProvider>
        <App />
      </MonitorProvider>
    </BrowserRouter>
  </StrictMode>,
);
