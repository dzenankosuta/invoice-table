// Month names in English
const monthNames = {
    '01': 'January',
    '02': 'February', 
    '03': 'March',
    '04': 'April',
    '05': 'May',
    '06': 'June',
    '07': 'July',
    '08': 'August',
    '09': 'September',
    '10': 'October',
    '11': 'November',
    '12': 'December'
};

// Get number of days in month
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// Check if date is weekend
function isWeekend(year, month, day) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

// Get working days in month (Monday-Friday)
function getWorkingDaysInMonth(year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    let workingDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        if (!isWeekend(year, month, day)) {
            workingDays++;
        }
    }
    
    return workingDays;
}

// Get current payment settings
function getPaymentSettings() {
    const mode = document.querySelector('input[name="paymentMode"]:checked').value;
    const hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 15;
    const monthlyPay = parseFloat(document.getElementById('monthlyPay').value) || 0;
    const minDailyHours = parseFloat(document.getElementById('minDailyHours').value) || 5;
    
    return { mode, hourlyRate, monthlyPay, minDailyHours };
}

// Generate table rows based on selected month
function generateTableRows(year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    let rows = '';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const formattedDay = String(day).padStart(2, '0');
        const formattedMonth = String(month).padStart(2, '0');
        const dateStr = `${formattedDay}.${formattedMonth}.${year}`;
        const weekendClass = isWeekend(year, month, day) ? 'weekend' : '';
        
        rows += `<tr class="${weekendClass}">
            <td>${dateStr}</td>
            <td><textarea oninput="autoResize(this)"></textarea></td>
            <td><input type="number" onchange="calculateHours(this)" placeholder="0"></td>
            <td><input type="number" step="0.01" onchange="calculateMinutes(this)" placeholder="0.00" class="readonly"></td>
            <td class="currency readonly">€0.00</td>
        </tr>`;
    }
    
    // Add total row
    rows += `<tr class="total-row">
        <td><strong>TOTAL</strong></td>
        <td></td>
        <td id="totalMinutes" class="currency"><strong>0</strong></td>
        <td id="totalHours" class="currency"><strong>0.00</strong></td>
        <td id="totalAmount" class="currency"><strong>€0.00</strong></td>
    </tr>`;
    
    return rows;
}

// Update table when month changes
function updateTable() {
    const monthInput = document.getElementById('monthPicker');
    const [year, month] = monthInput.value.split('-');
    
    // Update title
    const monthName = monthNames[month];
    document.getElementById('pageTitle').textContent = `Timesheet - ${monthName} ${year}`;
    
    // Generate new table rows
    const tbody = document.querySelector('#timesheetTable tbody');
    tbody.innerHTML = generateTableRows(parseInt(year), parseInt(month));
    
    // Store current month in localStorage
    localStorage.setItem('selectedMonth', monthInput.value);
}

// Initialize month picker with current month
function initializeMonthPicker() {
    const monthPicker = document.getElementById('monthPicker');
    
    // Check if there's a saved month
    const savedMonth = localStorage.getItem('selectedMonth');
    if (savedMonth) {
        monthPicker.value = savedMonth;
    } else {
        // Set to current month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        monthPicker.value = `${year}-${month}`;
    }
    
    // Add event listener
    monthPicker.addEventListener('change', updateTable);
    
    // Initial table update
    updateTable();
}

// Auto-resize textarea function
function autoResize(textarea) {
    // Reset height to default
    textarea.style.height = '18px';
    
    // Only increase if content doesn't fit
    if (textarea.scrollHeight > 18) {
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }
}

// Calculate hours from minutes
function calculateHours(minutesInput) {
    const row = minutesInput.closest('tr');
    const hoursInput = row.querySelector('td:nth-child(4) input');
    const amountCell = row.querySelector('td:nth-child(5)');
    
    const minutes = parseFloat(minutesInput.value) || 0;
    const hours = (minutes / 60).toFixed(2);
    
    hoursInput.value = hours;
    calculateAmount(row);
    updateTotals();
}

// Calculate minutes from hours
function calculateMinutes(hoursInput) {
    const row = hoursInput.closest('tr');
    const minutesInput = row.querySelector('td:nth-child(3) input');
    
    const hours = parseFloat(hoursInput.value) || 0;
    const minutes = Math.round(hours * 60);
    
    minutesInput.value = minutes;
    calculateAmount(row);
    updateTotals();
}

// Calculate amount based on payment mode
function calculateAmount(row) {
    const hoursInput = row.querySelector('td:nth-child(4) input');
    const amountCell = row.querySelector('td:nth-child(5)');
    const hours = parseFloat(hoursInput.value) || 0;
    
    const settings = getPaymentSettings();
    let amount = 0;
    
    if (settings.mode === 'hourly') {
        amount = hours * settings.hourlyRate;
    } else {
        // Daily minimum mode
        if (hours >= settings.minDailyHours) {
            // Calculate daily rate from monthly salary
            const monthInput = document.getElementById('monthPicker');
            const [year, month] = monthInput.value.split('-');
            const workingDays = getWorkingDaysInMonth(parseInt(year), parseInt(month));
            amount = settings.monthlyPay / workingDays;
        } else {
            // Less than minimum hours, pay hourly
            amount = hours * settings.hourlyRate;
        }
    }
    
    amountCell.textContent = `€${amount.toFixed(2)}`;
}

// Update totals
function updateTotals() {
    const table = document.getElementById('timesheetTable');
    const rows = table.querySelectorAll('tbody tr:not(.total-row)');
    const settings = getPaymentSettings();
    
    let totalMinutes = 0;
    let totalHours = 0;
    let totalAmount = 0;
    
    rows.forEach(row => {
        const minutesInput = row.querySelector('td:nth-child(3) input');
        const hoursInput = row.querySelector('td:nth-child(4) input');
        const amountText = row.querySelector('td:nth-child(5)').textContent;
        
        const minutes = parseFloat(minutesInput.value) || 0;
        const hours = parseFloat(hoursInput.value) || 0;
        const amount = parseFloat(amountText.replace('€', '')) || 0;
        
        totalMinutes += minutes;
        totalHours += hours;
        totalAmount += amount;
    });
    
    // Calculate hour difference for daily minimum mode
    let hourDifference = '';
    if (settings.mode === 'daily') {
        // Get total expected hours based on all working days in the month
        const monthInput = document.getElementById('monthPicker');
        const [year, month] = monthInput.value.split('-');
        const workingDays = getWorkingDaysInMonth(parseInt(year), parseInt(month));
        const expectedHours = workingDays * settings.minDailyHours;
        
        const diff = totalHours - expectedHours;
        const sign = diff >= 0 ? '+' : '';
        hourDifference = ` (${sign}${diff.toFixed(2)})`;
    }
    
    document.getElementById('totalMinutes').innerHTML = `<strong>${totalMinutes}</strong>`;
    document.getElementById('totalHours').innerHTML = `<strong>${totalHours.toFixed(2)}${hourDifference}</strong>`;
    document.getElementById('totalAmount').innerHTML = `<strong>€${totalAmount.toFixed(2)}</strong>`;
}

// Export table function
function exportTable() {
    const table = document.getElementById('timesheetTable');
    const rows = table.querySelectorAll('tbody tr');
    const monthYear = document.getElementById('pageTitle').textContent.replace('Timesheet - ', '');
    
    // Create HTML table
    let htmlContent = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + monthYear + '</title></head><body>';
    htmlContent += '<h2 style="text-align: center;">' + monthYear + '</h2>';
    htmlContent += '<table border="1" cellspacing="0" cellpadding="5" style="border-collapse: collapse; width: 100%;">';
    
    // Add headers
    htmlContent += '<tr style="background-color: #C8C8C8; color: white;">';
    htmlContent += '<th>Date</th><th>Description</th><th>Minutes</th><th>Hours (Decimal)</th><th>Amount (EUR)</th>';
    htmlContent += '</tr>';
    
    // Add data rows
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        const isTotal = row.classList.contains('total-row');
        
        if (isTotal) {
            htmlContent += '<tr style="background-color: #e9ecef; font-weight: bold;">';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8;">' + cells[0].textContent + '</td>';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8;"></td>';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8; text-align: center;">' + cells[2].textContent + '</td>';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8; text-align: center;">' + cells[3].textContent + '</td>';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8; text-align: right;">' + cells[4].textContent + '</td>';
        } else {
            const bgColor = row.classList.contains('weekend') ? '#f0f0f0' : (index % 2 === 0 ? '#ffffff' : '#f9f9f9');
            htmlContent += '<tr style="background-color: ' + bgColor + ';">';
            htmlContent += '<td>' + cells[0].textContent + '</td>';
            htmlContent += '<td>' + (cells[1].querySelector('textarea').value || '') + '</td>';
            htmlContent += '<td style="text-align: center;">' + (cells[2].querySelector('input').value || '0') + '</td>';
            htmlContent += '<td style="text-align: center;">' + (cells[3].querySelector('input').value || '0.00') + '</td>';
            htmlContent += '<td style="text-align: right;">' + cells[4].textContent + '</td>';
        }
        htmlContent += '</tr>';
    });
    
    htmlContent += '</table></body></html>';
    
    // Download as HTML file
    const blob = new Blob([htmlContent], { 
        type: 'text/html;charset=utf-8'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = 'timesheet_' + monthYear.toLowerCase().replace(/\s+/g, '_') + '.html';
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize payment mode toggle
function initializePaymentMode() {
    const paymentModeInputs = document.querySelectorAll('input[name="paymentMode"]');
    const dailySettings = document.querySelector('.daily-settings');
    
    paymentModeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.value === 'daily') {
                dailySettings.style.display = 'flex';
            } else {
                dailySettings.style.display = 'none';
            }
            // Recalculate all amounts
            const rows = document.querySelectorAll('#timesheetTable tbody tr:not(.total-row)');
            rows.forEach(row => calculateAmount(row));
            updateTotals();
        });
    });
    
    // Add event listeners to payment inputs
    document.getElementById('hourlyRate').addEventListener('change', () => {
        const rows = document.querySelectorAll('#timesheetTable tbody tr:not(.total-row)');
        rows.forEach(row => calculateAmount(row));
        updateTotals();
    });
    
    document.getElementById('monthlyPay').addEventListener('change', () => {
        const rows = document.querySelectorAll('#timesheetTable tbody tr:not(.total-row)');
        rows.forEach(row => calculateAmount(row));
        updateTotals();
    });
    
    document.getElementById('minDailyHours').addEventListener('change', () => {
        const rows = document.querySelectorAll('#timesheetTable tbody tr:not(.total-row)');
        rows.forEach(row => calculateAmount(row));
        updateTotals();
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeMonthPicker();
    initializePaymentMode();
});