import { initCalendar } from './calendar.js';
import { initReportModule } from './report.js';
import { openSavingsModal } from './modal.js';

// Глобальные переменные накоплений
let savings = [];

// Загрузка целей из localStorage
function loadSavings() {
  const saved = localStorage.getItem('savings');
  if (saved) {
    try {
      savings = JSON.parse(saved);
    } catch (e) {
      console.error('Ошибка загрузки целей:', e);
      savings = [];
    }
  }
}

// Сохранение целей в localStorage
function saveSavings() {
  localStorage.setItem('savings', JSON.stringify(savings));
}

// Начисление процентов
function calculateMonthlyInterest() {
  savings.forEach(goal => {
    if (goal.isPercentage && goal.rate > 0 && goal.balance > 0) {
      const interest = goal.balance * (goal.rate / 100);
      goal.balance += interest;
      goal.transactions.push({
        date: new Date().toISOString(),
        amount: interest,
        type: 'interest'
      });
    }
  });
  saveSavings();
}

// Инициализация модуля накоплений
export const initSavingsModule = () => {
  loadSavings();
  
  // Обработчик кнопки накоплений
  const savingsBtn = document.getElementById('savingsBtn');
  if (savingsBtn) {
    savingsBtn.addEventListener('click', openSavingsModal);
  }
}

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
  initSavingsModule();
});
