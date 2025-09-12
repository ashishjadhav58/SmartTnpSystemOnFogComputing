import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { store } from './store/store';
// import Tp from './Tp.jsx'; // if you need this later

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  </StrictMode>
);
