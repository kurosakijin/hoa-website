import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import './styles/tailwind.css';
import './styles/main.scss';

const enableVercelAnalytics = import.meta.env.PROD && import.meta.env.VITE_ENABLE_VERCEL_ANALYTICS === 'true';
const enableVercelSpeedInsights =
  import.meta.env.PROD && import.meta.env.VITE_ENABLE_VERCEL_SPEED_INSIGHTS === 'true';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
            {enableVercelAnalytics ? <Analytics /> : null}
            {enableVercelSpeedInsights ? <SpeedInsights /> : null}
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
