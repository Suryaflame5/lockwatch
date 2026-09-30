import React from 'react';
import ReactDOM from 'react-dom/client';
import { FacultyAuthProvider } from './context/FacultyAuthContext';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FacultyAuthProvider>
      <App />
    </FacultyAuthProvider>
  </React.StrictMode>
);
