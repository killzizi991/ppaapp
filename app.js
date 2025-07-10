import { initCalendar } from './calendar.js';
import { initReportModule } from './report.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Регистрация сервис-воркера
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/ppapp/service-worker.js', {
        scope: '/ppapp/'
      });
      console.log('Service Worker зарегистрирован');
    } catch (err) {
      console.error('Ошибка регистрации SW:', err);
    }
  }

  // Обработка установки PWA
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            console.log('PWA установлено');
          }
          deferredPrompt = null;
          installBtn.style.display = 'none';
        }
      });
    }
  });

  // Инициализация модулей
  await initCalendar();
  initReportModule();
});
