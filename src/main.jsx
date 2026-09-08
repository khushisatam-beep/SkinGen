import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import './styles/App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* AppProvider wraps root to provide useContext globally */}
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
