import { saveDayData } from './storage.js';

const modalRoot = document.getElementById('modal-root');
const expenseCategories = ["Продукты", "Бытхимия", "Кредит", "Связь", "Страховка", "Техника", "Другое"];

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
    
    const revenueGroup = createInputGroup('revenue', 'Выручка', 'number', dayData?.revenue || '');
    const clientsGroup = createInputGroup('clients', 'Клиенты', 'number', dayData?.clients || '');
    
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
    
    const balanceGroup = document.createElement('div');
    balanceGroup.className = 'balance-group';
    
    const balanceLabel = document.createElement('label');
    balanceLabel.textContent = 'Баланс:';
    
    const balanceValue = document.createElement('span');
    balanceValue.id = 'balance-value';
    balanceValue.textContent = calculateBalance(dayData) || '0';
    
    balanceGroup.appendChild(balanceLabel);
    balanceGroup.appendChild(balanceValue);
    
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'save-button';
    saveButton.textContent = 'Сохранить';
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            revenue: parseFloat(revenueGroup.querySelector('input').value) || 0,
            clients: parseInt(clientsGroup.querySelector('input').value) || 0,
            expenses: {}
        };
        
        expenseCategories.forEach(category => {
            const value = parseFloat(expensesGroup.querySelector(`#expense-${category}`).value) || 0;
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
    
    const updateBalance = () => {
        const revenue = parseFloat(revenueGroup.querySelector('input').value) || 0;
        const expenses = expenseCategories.reduce((sum, category) => {
            const value = parseFloat(expensesGroup.querySelector(`#expense-${category}`).value) || 0;
            return sum + value;
        }, 0);
        
        balanceValue.textContent = (revenue - expenses).toLocaleString('ru-RU');
    };
    
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateBalance);
    });
    
    form.appendChild(revenueGroup);
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
