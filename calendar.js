import { getDayData, getMonthData } from './storage.js';
import { openDayModal } from './modal.js';

const calendarModule = document.getElementById('calendar-module');
const currentMonthYearEl = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

let currentMonth = parseInt(localStorage.getItem('currentMonth') || new Date().getMonth());
let currentYear = parseInt(localStorage.getItem('currentYear') || new Date().getFullYear());

localStorage.setItem('currentMonth', currentMonth);
localStorage.setItem('currentYear', currentYear);

export const initCalendar = async () => {
  prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
  nextMonthBtn.addEventListener('click', () => navigateMonth(1));
  await renderCalendar();
};

const navigateMonth = (direction) => {
  currentMonth += direction;
  
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  
  localStorage.setItem('currentMonth', currentMonth);
  localStorage.setItem('currentYear', currentYear);
  renderCalendar();
  document.dispatchEvent(new CustomEvent('monthChanged'));
};

const renderCalendar = async () => {
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  currentMonthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  calendarModule.innerHTML = '';
  
  const calendarGrid = document.createElement('div');
  calendarGrid.className = 'calendar-grid';
  
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekdays.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day weekday-header';
    dayElement.textContent = day;
    calendarGrid.appendChild(dayElement);
  });
  
  const firstDay = new Date(currentYear, currentMonth, 1);
  const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  
  for (let i = 1; i < firstDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDay);
  }
  
  const monthData = await getMonthData(currentYear, currentMonth);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    const dayData = monthData[dateString] || null;
    
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
      dayElement.classList.add('today');
    }
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    if (dayData) {
      const marker = document.createElement('div');
      marker.className = 'day-marker';
      marker.textContent = '•';
      dayElement.appendChild(marker);
    }
    
    if (dayData) {
      const summary = document.createElement('div');
      summary.className = 'day-summary';
      
      if (dayData.revenue && dayData.revenue > 0) {
        const revenueEl = document.createElement('div');
        revenueEl.style.color = 'var(--income-color)';
        revenueEl.textContent = `+${dayData.revenue}`;
        summary.appendChild(revenueEl);
      }
      
      if (dayData.expenses) {
        const totalExpenses = Object.values(dayData.expenses).reduce((sum, val) => sum + val, 0);
        if (totalExpenses > 0) {
          const expensesEl = document.createElement('div');
          expensesEl.style.color = 'var(--expense-color)';
          expensesEl.textContent = `-${totalExpenses}`;
          summary.appendChild(expensesEl);
        }
      }
      
      dayElement.appendChild(summary);
    }
    
    dayElement.addEventListener('click', () => openDayModal(dateString, dayData));
    calendarGrid.appendChild(dayElement);
  }
  
  calendarModule.appendChild(calendarGrid);
};

document.addEventListener('dataSaved', renderCalendar);
