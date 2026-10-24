/**
 * Registra o Service Worker do Cinemateca para suporte PWA e funcionamento offline.
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Cinemateca Service Worker registrado com escopo:', registration.scope);
        })
        .catch((error) => {
          console.warn('Falha ao registrar Service Worker do Cinemateca:', error);
        });
    });
  }
}
