import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createAppStore } from './app/store';
import { App } from './components/App';
import './styles/global.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={createAppStore()}>
      <App />
    </Provider>
  </StrictMode>,
);
