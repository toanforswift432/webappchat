import React from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { injectStore } from './services/axios';
import { App } from './App';
import { LanguageProvider } from './i18n/LanguageContext';

injectStore(store);

const container = document.getElementById('root')!;
createRoot(container).render(
  <Provider store={store}>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </Provider>
);
