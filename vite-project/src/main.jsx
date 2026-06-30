import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { clearInvalidSession } from './utils/clearInvalidSession';
// import Tp from './Tp.jsx'; // if you need this later

// Add an Axios request interceptor to dynamically inject the ngrok skip-browser-warning header
axios.interceptors.request.use((config) => {
  const url = config.url || '';
  // Only inject the header if the request goes to an ngrok tunnel URL
  if (url.includes('ngrok-free.app') || url.includes('ngrok.io')) {
    config.headers['ngrok-skip-browser-warning'] = 'true';
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
if (typeof window !== 'undefined') {
  window.axios = axios;
  window.bootstrap = bootstrap;
  window.html2pdf = html2pdf;
  window.html2canvas = html2canvas;
  window.jspdf = { jsPDF };
}

// Clear invalid session data on app startup
clearInvalidSession();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  </StrictMode>
);
