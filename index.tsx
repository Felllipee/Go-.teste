
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("🎬 fastShorts: Iniciando montagem do catálogo...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Elemento root não encontrado.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
