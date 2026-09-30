import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { StudentAuthProvider } from './context/StudentAuthContext';
import { FacultyAuthProvider } from './faculty/context/FacultyAuthContext';

function mount() {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <FacultyAuthProvider>
          <StudentAuthProvider>
            <App />
          </StudentAuthProvider>
        </FacultyAuthProvider>
      </React.StrictMode>
    );
  } else {
    console.error('Critical: #root element not found in DOM');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
