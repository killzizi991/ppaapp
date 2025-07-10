import { getMonthData } from './storage.js';

const reportModule = document.getElementById('report-module');
const reportBtn = document.getElementById('reportBtn');
const closeReportBtn = document.getElementById('closeReportBtn');
const reportContent = document.getElementById('report-content');

let currentMonth, currentYear;

export const initReportModule = () => {
    reportBtn.addEventListener('click', openReport);
    closeReportBtn.addEventListener('click', closeReport);
    
    currentMonth = parseInt(localStorage.getItem('currentMonth') || new Date().getMonth());
    currentYear = parseInt(localStorage.getItem('currentYear') || new Date().getFullYear());
    
    document.addEventListener('monthChanged', () => {
        currentMonth = parseInt(localStorage.getItem('currentMonth'));
        currentYear = parseInt(localStorage.getItem('currentYear'));
    });
};

async function openReport() {
    const monthData = await getMonthData(currentYear, currentMonth);
    
    let totalRevenue = 0;
    let totalClients = 0;
    let daysWithData = 0;
    const categoryTotals = {};
    
    Object.values(monthData).forEach(day => {
        totalRevenue += day.revenue || 0;
        totalClients += day.clients || 0;
        
        if (day.revenue > 0 || day.clients > 0) daysWithData++;
        
        if (day.expenses) {
            Object.entries(day.expenses).forEach(([category, amount]) => {
                if (!categoryTotals[category]) categoryTotals[category] = 0;
                categoryTotals[category] += amount;
            });
        }
    });
    
    const avgClients = daysWithData > 0 ? (totalClients / daysWithData).toFixed(1) : 0;
    const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const balance = totalRevenue - totalExpenses;
    
    reportContent.innerHTML = `
        <div class="report-summary">
            <div class="report-item">
                <span>Общая выручка:</span>
                <span class="income-value">${totalRevenue.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div class="report-item">
                <span>Среднее количество клиентов:</span>
                <span>${avgClients}</span>
            </div>
            <div class="report-item">
                <span>Общие расходы:</span>
                <span class="expense-value">${totalExpenses.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div class="report-item">
                <span>Итоговый баланс:</span>
                <span class="${balance >= 0 ? 'income-value' : 'expense-value'}">${balance.toLocaleString('ru-RU')} ₽</span>
            </div>
        </div>
        
        <h3>Расходы по категориям</h3>
        <div class="expense-categories">
            ${Object.entries(categoryTotals).map(([category, total]) => `
                <div class="category-item">
                    <span>${category}:</span>
                    <span class="expense-value">${total.toLocaleString('ru-RU')} ₽</span>
                </div>
            `).join('')}
        </div>
    `;
    
    reportModule.style.display = 'block';
}

function closeReport() {
    reportModule.style.display = 'none';
}
