import { initCalendar } from './calendar.js';
import { initReportModule } from './report.js';
import { openAddGoalModal, openAddMoneyModal, openEditRateModal } from './modal.js';

// НАКОПЛЕНИЯ: Глобальные переменные
let savings = [];

// НАКОПЛЕНИЯ: Загрузка целей из localStorage
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

// НАКОПЛЕНИЯ: Сохранение целей в localStorage
function saveSavings() {
  localStorage.setItem('savings', JSON.stringify(savings));
}

// НАКОПЛЕНИЯ: Создание новой цели
function createGoal(name, isPercentage = false, rate = 0) {
  return {
    id: Date.now().toString(),
    name,
    balance: 0,
    isPercentage,
    rate,
    transactions: []
  };
}

// НАКОПЛЕНИЯ: Пополнение цели
function addToGoal(goalId, amount) {
  const goal = savings.find(g => g.id === goalId);
  if (!goal || amount <= 0) return;
  
  goal.balance += amount;
  goal.transactions.push({
    date: new Date().toISOString(),
    amount
  });
  
  saveSavings();
  renderSavings();
}

// НАКОПЛЕНИЯ: Обновление процентной ставки
function updateGoalRate(goalId, newRate) {
  const goal = savings.find(g => g.id === goalId);
  if (!goal) return;
  
  goal.rate = newRate;
  saveSavings();
  renderSavings();
}

// НАКОПЛЕНИЯ: Удаление цели
function deleteGoal(goalId) {
  savings = savings.filter(g => g.id !== goalId);
  saveSavings();
  renderSavings();
}

// НАКОПЛЕНИЯ: Начисление процентов
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
  renderSavings();
}

// НАКОПЛЕНИЯ: Отрисовка целей
function renderSavings() {
  const container = document.getElementById('savings-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  savings.forEach(goal => {
    const goalEl = document.createElement('div');
    goalEl.className = 'savings-goal';
    
    goalEl.innerHTML = `
      <div class="savings-header">
        <div class="goal-name">${goal.name}</div>
        <div class="goal-balance">${goal.balance.toFixed(2)} ₽</div>
      </div>
      
      ${goal.isPercentage ? 
        `<div class="percentage-badge">${goal.rate}% в месяц</div>` : ''}
      
      <div class="savings-actions">
        <button class="savings-btn add-money-btn" data-id="${goal.id}">Пополнить</button>
        ${goal.isPercentage ? 
          `<button class="savings-btn edit-rate-btn" data-id="${goal.id}">Изменить %</button>` : ''}
        <button class="savings-btn delete-goal-btn" data-id="${goal.id}">Удалить</button>
      </div>
    `;
    
    container.appendChild(goalEl);
  });
  
  // Добавляем обработчики событий
  document.querySelectorAll('.add-money-btn').forEach(btn => {
    btn.addEventListener('click', () => openAddMoneyModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.edit-rate-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditRateModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-goal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Удалить цель накопления? Все данные будут потеряны.')) {
        deleteGoal(btn.dataset.id);
      }
    });
  });
}

// НАКОПЛЕНИЯ: Инициализация модуля
function initSavingsModule() {
  loadSavings();
  renderSavings();
  
  // Обработчик кнопки добавления цели
  const addGoalBtn = document.getElementById('add-goal-btn');
  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', openAddGoalModal);
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
  initSavingsModule(); // Инициализация модуля накоплений
});
