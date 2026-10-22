import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './auth';
import { LiveProvider } from './live';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <LiveProvider>
          <App />
        </LiveProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
