import { saveDayData } from './storage.js';

const modalRoot = document.getElementById('modal-root');
const expenseCategories = ["Продукты", "Бытхимия", "Кредит", "Связь", "Страховка", "Техника", "Другое", "Кварплата"];
const incomeCategories = ["Пенсия"];

// Глобальная ссылка на контейнер целей
let savingsContainer = null;

// Глобальные данные накоплений
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

// Создание новой цели
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

// Пополнение цели
function addToGoal(goalId, amount) {
  const goal = savings.find(g => g.id === goalId);
  if (!goal || amount <= 0) return;
  
  goal.balance += amount;
  goal.transactions.push({
    date: new Date().toISOString(),
    amount
  });
  
  saveSavings();
}

// Обновление процентной ставки
function updateGoalRate(goalId, newRate) {
  const goal = savings.find(g => g.id === goalId);
  if (!goal) return;
  
  goal.rate = newRate;
  saveSavings();
}

// Удаление цели
function deleteGoal(goalId) {
  savings = savings.filter(g => g.id !== goalId);
  saveSavings();
}

// Отрисовка целей в модальном окне
function renderSavings() {
  if (!savingsContainer) return;
  
  savingsContainer.innerHTML = '';
  
  if (savings.length === 0) {
    savingsContainer.innerHTML = '<p class="no-goals">Нет созданных целей. Нажмите "+ Добавить цель"</p>';
    return;
  }
  
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
    
    savingsContainer.appendChild(goalEl);
  });
  
  // Добавляем обработчики событий
  savingsContainer.querySelectorAll('.add-money-btn').forEach(btn => {
    btn.addEventListener('click', () => openAddMoneyModal(btn.dataset.id));
  });
  
  savingsContainer.querySelectorAll('.edit-rate-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditRateModal(btn.dataset.id));
  });
  
  savingsContainer.querySelectorAll('.delete-goal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Удалить цель накопления? Все данные будут потеряны.')) {
        deleteGoal(btn.dataset.id);
        renderSavings();
      }
    });
  });
}

// Модальное окно дня
export const openDayModal = (dateString, dayData = null) => {
    modalRoot.innerHTML = '';
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.addEventListener('click', closeModal);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.addEventListener('click', e => e.stopPropagation());
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = formatDate(dateString);
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', closeModal);
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    const form = document.createElement('form');
    form.className = 'modal-form';
    
    // Доходы
    const revenueGroup = createInputGroup('revenue', 'Выручка', 'number', dayData?.revenue || '');
    
    // Категории доходов
    const incomeGroup = document.createElement('div');
    incomeGroup.className = 'input-group';
    
    const incomeLabel = document.createElement('label');
    incomeLabel.textContent = 'Категория дохода';
    
    const incomeSelect = document.createElement('select');
    incomeSelect.id = 'income-category';
    
    incomeCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        incomeSelect.appendChild(option);
    });
    
    // Выбираем сохраненную категорию
    if (dayData?.incomeCategory) {
        incomeSelect.value = dayData.incomeCategory;
    }
    
    incomeGroup.appendChild(incomeLabel);
    incomeGroup.appendChild(incomeSelect);
    
    // Клиенты
    const clientsGroup = createInputGroup('clients', 'Клиенты', 'number', dayData?.clients || '');
    
    // Расходы
    const expensesTitle = document.createElement('h3');
    expensesTitle.textContent = 'Расходы';
    
    const expensesGroup = document.createElement('div');
    expensesGroup.className = 'expenses-group';
    
    expenseCategories.forEach(category => {
        const categoryGroup = createInputGroup(
            `expense-${category}`, 
            category, 
            'number', 
            dayData?.expenses?.[category] || ''
        );
        expensesGroup.appendChild(categoryGroup);
    });
    
    // Баланс
    const balanceGroup = document.createElement('div');
    balanceGroup.className = 'balance-group';
    
    const balanceLabel = document.createElement('label');
    balanceLabel.textContent = 'Баланс:';
    
    const balanceValue = document.createElement('span');
    balanceValue.id = 'balance-value';
    balanceValue.textContent = calculateBalance(dayData) || '0';
    
    balanceGroup.appendChild(balanceLabel);
    balanceGroup.appendChild(balanceValue);
    
    // Кнопка сохранения
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'save-button';
    saveButton.textContent = 'Сохранить';
    
    // Обработчик формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            revenue: parseFloat(revenueGroup.querySelector('input').value) || 0,
            clients: parseInt(clientsGroup.querySelector('input').value) || 0,
            incomeCategory: incomeSelect.value,
            expenses: {}
        };
        
        expenseCategories.forEach(category => {
            const input = expensesGroup.querySelector(`#expense-${category}`);
            const value = parseFloat(input.value) || 0;
            formData.expenses[category] = value;
        });
        
        formData.balance = formData.revenue - Object.values(formData.expenses).reduce((sum, val) => sum + val, 0);
        
        try {
            await saveDayData(dateString, formData);
            closeModal();
            document.dispatchEvent(new CustomEvent('dataSaved'));
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            alert('Не удалось сохранить данные');
        }
    });
    
    // Обновление баланса
    const updateBalance = () => {
        const revenue = parseFloat(revenueGroup.querySelector('input').value) || 0;
        const expenses = expenseCategories.reduce((sum, category) => {
            const input = expensesGroup.querySelector(`#expense-${category}`);
            const value = parseFloat(input.value) || 0;
            return sum + value;
        }, 0);
        
        balanceValue.textContent = (revenue - expenses).toLocaleString('ru-RU');
    };
    
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateBalance);
    });
    
    // Сборка формы
    form.appendChild(revenueGroup);
    form.appendChild(incomeGroup);
    form.appendChild(clientsGroup);
    form.appendChild(expensesTitle);
    form.appendChild(expensesGroup);
    form.appendChild(balanceGroup);
    form.appendChild(saveButton);
    
    modal.appendChild(modalHeader);
    modal.appendChild(form);
    modalOverlay.appendChild(modal);
    modalRoot.appendChild(modalOverlay);
    
    modalOverlay.style.animation = 'fadeIn 0.3s forwards';
    modal.style.animation = 'slideUp 0.3s forwards';
};

// Модальное окно управления накоплениями
export const openSavingsModal = () => {
    modalRoot.innerHTML = '';
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.addEventListener('click', closeModal);
    
    const modal = document.createElement('div');
    modal.className = 'modal savings-modal';
    modal.addEventListener('click', e => e.stopPropagation());
    
    modal.innerHTML = `
        <div class="modal-header">
            <h2>Управление накоплениями</h2>
            <button class="close-button">&times;</button>
        </div>
        
        <div class="savings-content">
            <button id="add-goal-btn" class="add-goal-btn">+ Добавить цель</button>
            <div id="savings-container" class="savings-container"></div>
        </div>
    `;
    
    modalOverlay.appendChild(modal);
    modalRoot.appendChild(modalOverlay);
    
    // Инициализация контейнера
    savingsContainer = modal.querySelector('#savings-container');
    
    // Обработчики
    modal.querySelector('.close-button').addEventListener('click', closeModal);
    modal.querySelector('#add-goal-btn').addEventListener('click', openAddGoalModal);
    
    // Отрисовка целей
    renderSavings();
    
    modalOverlay.style.animation = 'fadeIn 0.3s forwards';
    modal.style.animation = 'slideUp 0.3s forwards';
};

// Модальное окно создания цели
export const openAddGoalModal = () => {
    modalRoot.innerHTML = '';
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.addEventListener('click', closeModal);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.addEventListener('click', e => e.stopPropagation());
    
    modal.innerHTML = `
        <div class="modal-header">
            <h2>Новая цель накоплений</h2>
            <button class="close-button">&times;</button>
        </div>
        
        <form class="modal-form">
            <div class="input-group">
                <label for="goal-name">Название цели</label>
                <input type="text" id="goal-name" required placeholder="Например: Отпуск">
            </div>
            
            <div class="input-group">
                <label>
                    <input type="checkbox" id="is-percentage">
                    Процентный вклад
                </label>
            </div>
            
            <div class="input-group" id="rate-group" style="display: none;">
                <label for="interest-rate">Процентная ставка (% в месяц)</label>
                <input type="number" id="interest-rate" min="0" max="100" step="0.1" value="5">
            </div>
            
            <button type="submit" class="save-button">Создать</button>
        </form>
    `;
    
    modalOverlay.appendChild(modal);
    modalRoot.appendChild(modalOverlay);
    
    // Показ/скрытие поля процента
    const percentageCheckbox = modal.querySelector('#is-percentage');
    const rateGroup = modal.querySelector('#rate-group');
    
    percentageCheckbox.addEventListener('change', () => {
        rateGroup.style.display = percentageCheckbox.checked ? 'block' : 'none';
    });
    
    // Обработчик отправки формы
    modal.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = modal.querySelector('#goal-name').value.trim();
        const isPercentage = modal.querySelector('#is-percentage').checked;
        const rate = isPercentage ? 
            parseFloat(modal.querySelector('#interest-rate').value) : 0;
        
        if (!name) {
            alert('Введите название цели');
            return;
        }
        
        // Создаем и сохраняем цель
        const newGoal = createGoal(name, isPercentage, rate);
        savings.push(newGoal);
        saveSavings();
        openSavingsModal(); // Возвращаемся к основному окну накоплений
    });
    
    // Обработчик закрытия
    modal.querySelector('.close-button').addEventListener('click', openSavingsModal);
};

// Модальное окно пополнения цели
export const openAddMoneyModal = (goalId) => {
    const goal = savings.find(g => g.id === goalId);
    if (!goal) return;
    
    modalRoot.innerHTML = '';
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.addEventListener('click', closeModal);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.addEventListener('click', e => e.stopPropagation());
    
    modal.innerHTML = `
        <div class="modal-header">
            <h2>Пополнение: ${goal.name}</h2>
            <button class="close-button">&times;</button>
        </div>
        
        <form class="modal-form">
            <div class="input-group">
                <label for="add-amount">Сумма пополнения (₽)</label>
                <input type="number" id="add-amount" min="1" step="any" required placeholder="Введите сумму">
            </div>
            
            <div class="balance-group">
                <span>Текущий баланс:</span>
                <span>${goal.balance.toFixed(2)} ₽</span>
            </div>
            
            <button type="submit" class="save-button">Пополнить</button>
        </form>
    `;
    
    modalOverlay.appendChild(modal);
    modalRoot.appendChild(modalOverlay);
    
    // Обработчик отправки формы
    modal.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const amount = parseFloat(modal.querySelector('#add-amount').value);
        if (isNaN(amount) || amount <= 0) {
            alert('Введите корректную сумму');
            return;
        }
        
        addToGoal(goalId, amount);
        openSavingsModal(); // Возвращаемся к основному окну накоплений
    });
    
    // Обработчик закрытия
    modal.querySelector('.close-button').addEventListener('click', openSavingsModal);
};

// Модальное окно изменения ставки
export const openEditRateModal = (goalId) => {
    const goal = savings.find(g => g.id === goalId);
    if (!goal || !goal.isPercentage) return;
    
    modalRoot.innerHTML = '';
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.addEventListener('click', closeModal);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.addEventListener('click', e => e.stopPropagation());
    
    modal.innerHTML = `
        <div class="modal-header">
            <h2>Изменение ставки: ${goal.name}</h2>
            <button class="close-button">&times;</button>
        </div>
        
        <form class="modal-form">
            <div class="input-group">
                <label for="new-rate">Новая процентная ставка (% в месяц)</label>
                <input type="number" id="new-rate" min="0" max="100" step="0.1" value="${goal.rate}" required>
            </div>
            
            <div class="balance-group">
                <span>Текущий баланс:</span>
                <span>${goal.balance.toFixed(2)} ₽</span>
            </div>
            
            <button type="submit" class="save-button">Сохранить</button>
        </form>
    `;
    
    modalOverlay.appendChild(modal);
    modalRoot.appendChild(modalOverlay);
    
    // Обработчик отправки формы
    modal.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newRate = parseFloat(modal.querySelector('#new-rate').value);
        if (isNaN(newRate) || newRate < 0 || newRate > 100) {
            alert('Введите корректное значение ставки (0-100%)');
            return;
        }
        
        updateGoalRate(goalId, newRate);
        openSavingsModal(); // Возвращаемся к основному окну накоплений
    });
    
    // Обработчик закрытия
    modal.querySelector('.close-button').addEventListener('click', openSavingsModal);
};

function closeModal() {
    modalRoot.innerHTML = '';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function createInputGroup(id, labelText, type, value) {
    const group = document.createElement('div');
    group.className = 'input-group';
    
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;
    
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.value = value;
    input.min = 0;
    
    group.appendChild(label);
    group.appendChild(input);
    return group;
}

function calculateBalance(dayData) {
    if (!dayData) return '0';
    const expenses = dayData.expenses ? Object.values(dayData.expenses).reduce((sum, val) => sum + val, 0) : 0;
    return (dayData.revenue - expenses).toLocaleString('ru-RU');
}

// Инициализация при первой загрузке
loadSavings();
