
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("🎬 fastShorts: Montando aplicação...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ Erro: Elemento #root não encontrado!");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("✅ fastShorts: Aplicação renderizada com sucesso.");
} catch (err) {
  console.error("❌ Erro fatal durante a renderização:", err);
}
