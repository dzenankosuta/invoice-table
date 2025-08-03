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
            <td class="currency"><input type="number" step="0.01" placeholder="0.00" onchange="handleAmountChange(this)" style="width: 100%; text-align: right; border: 1px solid #ccc; padding: 5px; border-radius: 3px;"></td>
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
    
    // Load saved data for this month
    loadTableData();
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
function autoResize(textarea, skipSave = false) {
    // Reset height to default
    textarea.style.height = '18px';
    
    // Only increase if content doesn't fit
    if (textarea.scrollHeight > 18) {
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }
    
    // Auto-save on change (only if not called from loadTableData)
    if (!skipSave) {
        saveTableData();
    }
}

// Save table data to localStorage
function saveTableData() {
    const monthInput = document.getElementById('monthPicker');
    const monthKey = `timesheet_${monthInput.value}`;
    const rows = document.querySelectorAll('#timesheetTable tbody tr:not(.total-row)');
    
    const data = [];
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = {
            date: cells[0].textContent,
            description: cells[1].querySelector('textarea').value,
            minutes: cells[2].querySelector('input').value,
            hours: cells[3].querySelector('input').value,
            amount: cells[4].querySelector('input').value,
            manualAmount: cells[4].querySelector('input').dataset.manual === 'true'
        };
        data.push(rowData);
    });
    
    localStorage.setItem(monthKey, JSON.stringify(data));
    
    // Save payment settings
    savePaymentSettings();
}

// Load table data from localStorage
function loadTableData() {
    const monthInput = document.getElementById('monthPicker');
    const monthKey = `timesheet_${monthInput.value}`;
    const savedData = localStorage.getItem(monthKey);
    
    if (savedData) {
        const data = JSON.parse(savedData);
        const rows = document.querySelectorAll('#timesheetTable tbody tr:not(.total-row)');
        
        rows.forEach((row, index) => {
            if (data[index]) {
                const cells = row.querySelectorAll('td');
                cells[1].querySelector('textarea').value = data[index].description || '';
                cells[2].querySelector('input').value = data[index].minutes || '';
                cells[3].querySelector('input').value = data[index].hours || '';
                cells[4].querySelector('input').value = data[index].amount || '';
                if (data[index].manualAmount) {
                    cells[4].querySelector('input').dataset.manual = 'true';
                }
                
                // Auto-resize textareas with content
                if (data[index].description) {
                    autoResize(cells[1].querySelector('textarea'), true);
                }
            }
        });
        
        updateTotals();
    }
}

// Save payment settings
function savePaymentSettings() {
    const settings = {
        mode: document.querySelector('input[name="paymentMode"]:checked').value,
        hourlyRate: document.getElementById('hourlyRate').value,
        monthlyPay: document.getElementById('monthlyPay').value,
        minDailyHours: document.getElementById('minDailyHours').value,
        showHourDiff: document.getElementById('showHourDiff').checked
    };
    
    localStorage.setItem('timesheetSettings', JSON.stringify(settings));
}

// Load payment settings
function loadPaymentSettings() {
    const savedSettings = localStorage.getItem('timesheetSettings');
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Set payment mode
        document.querySelector(`input[name="paymentMode"][value="${settings.mode}"]`).checked = true;
        
        // Set values
        document.getElementById('hourlyRate').value = settings.hourlyRate || '15';
        document.getElementById('monthlyPay').value = settings.monthlyPay || '1500';
        document.getElementById('minDailyHours').value = settings.minDailyHours || '5';
        document.getElementById('showHourDiff').checked = settings.showHourDiff !== false; // Default true
        
        // Show/hide daily settings
        const dailySettings = document.querySelector('.daily-settings');
        if (settings.mode === 'daily') {
            dailySettings.style.display = 'flex';
        } else {
            dailySettings.style.display = 'none';
        }
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
    saveTableData();
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
    saveTableData();
}

// Calculate amount based on payment mode
function calculateAmount(row) {
    const hoursInput = row.querySelector('td:nth-child(4) input');
    const amountInput = row.querySelector('td:nth-child(5) input');
    const hours = parseFloat(hoursInput.value) || 0;
    
    // Check if amount was manually set
    if (amountInput.dataset.manual === 'true') {
        return; // Don't auto-calculate if manually set
    }
    
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
    
    amountInput.value = amount.toFixed(2);
}

// Handle manual amount changes
function handleAmountChange(amountInput) {
    const value = amountInput.value.trim();
    
    if (value === '' || value === '0' || value === '0.00') {
        // If cleared or set to 0, revert to auto-calculation
        amountInput.dataset.manual = 'false';
        const row = amountInput.closest('tr');
        calculateAmount(row);
    } else {
        // Mark as manually set
        amountInput.dataset.manual = 'true';
    }
    
    updateTotals();
    saveTableData();
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
        const amountInput = row.querySelector('td:nth-child(5) input');
        
        const minutes = parseFloat(minutesInput.value) || 0;
        const hours = parseFloat(hoursInput.value) || 0;
        const amount = parseFloat(amountInput.value) || 0;
        
        totalMinutes += minutes;
        totalHours += hours;
        totalAmount += amount;
    });
    
    // Calculate hour difference for daily minimum mode
    let hourDifference = '';
    const showHourDiff = document.getElementById('showHourDiff').checked;
    
    if (settings.mode === 'daily' && showHourDiff) {
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

// Export table function - main handler
function exportTable() {
    const format = document.getElementById('exportFormat').value;
    
    switch(format) {
        case 'word':
            exportToWord();
            break;
        case 'csv':
            exportToCSV();
            break;
        case 'excel':
            exportToExcel();
            break;
        case 'pdf':
            exportToPDF();
            break;
        case 'html':
            exportToHTML();
            break;
        default:
            exportToWord();
    }
}

// Export to Word (.doc)
function exportToWord() {
    const table = document.getElementById('timesheetTable');
    const rows = table.querySelectorAll('tbody tr');
    const monthYear = document.getElementById('pageTitle').textContent.replace('Timesheet - ', '');
    
    let htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">';
    htmlContent += '<head>';
    htmlContent += '<meta charset="utf-8">';
    htmlContent += '<title>' + monthYear + '</title>';
    htmlContent += '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->';
    htmlContent += '</head><body>';
    htmlContent += '<h2 style="text-align: center; font-family: Arial, sans-serif;">' + monthYear + '</h2>';
    htmlContent += '<table border="1" cellspacing="0" cellpadding="5" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11pt;">';
    
    htmlContent += '<tr style="background-color: #C8C8C8; color: white;">';
    htmlContent += '<th style="padding: 8px;">Date</th>';
    htmlContent += '<th style="padding: 8px;">Description</th>';
    htmlContent += '<th style="padding: 8px;">Minutes</th>';
    htmlContent += '<th style="padding: 8px;">Hours (Decimal)</th>';
    htmlContent += '<th style="padding: 8px;">Amount (EUR)</th>';
    htmlContent += '</tr>';
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        const isTotal = row.classList.contains('total-row');
        
        if (isTotal) {
            htmlContent += '<tr style="background-color: #e9ecef; font-weight: bold;">';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8; padding: 8px;">' + cells[0].textContent + '</td>';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8; padding: 8px;"></td>';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8; text-align: center; padding: 8px;">' + cells[2].textContent + '</td>';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8; text-align: center; padding: 8px;">' + cells[3].textContent + '</td>';
            htmlContent += '<td style="border-top: 2px solid #C8C8C8; text-align: right; padding: 8px;">' + cells[4].textContent + '</td>';
        } else {
            const bgColor = row.classList.contains('weekend') ? '#f0f0f0' : (index % 2 === 0 ? '#ffffff' : '#f9f9f9');
            htmlContent += '<tr style="background-color: ' + bgColor + ';">';
            htmlContent += '<td style="padding: 8px;">' + cells[0].textContent + '</td>';
            htmlContent += '<td style="padding: 8px;">' + (cells[1].querySelector('textarea').value || '') + '</td>';
            htmlContent += '<td style="text-align: center; padding: 8px;">' + (cells[2].querySelector('input').value || '0') + '</td>';
            htmlContent += '<td style="text-align: center; padding: 8px;">' + (cells[3].querySelector('input').value || '0.00') + '</td>';
            htmlContent += '<td style="text-align: right; padding: 8px;">€' + (cells[4].querySelector('input').value || '0.00') + '</td>';
        }
        htmlContent += '</tr>';
    });
    
    htmlContent += '</table></body></html>';
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    downloadFile(blob, 'timesheet_' + monthYear.toLowerCase().replace(/\s+/g, '_') + '.doc');
}

// Export to CSV
function exportToCSV() {
    const table = document.getElementById('timesheetTable');
    const rows = table.querySelectorAll('tbody tr');
    const monthYear = document.getElementById('pageTitle').textContent.replace('Timesheet - ', '');
    
    let csvContent = 'Date,Description,Minutes,Hours (Decimal),Amount (EUR)\n';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const isTotal = row.classList.contains('total-row');
        
        if (isTotal) {
            csvContent += cells[0].textContent + ',';
            csvContent += ',';
            csvContent += cells[2].textContent + ',';
            csvContent += cells[3].textContent + ',';
            csvContent += cells[4].textContent.replace('€', '') + '\n';
        } else {
            csvContent += cells[0].textContent + ',';
            csvContent += '"' + (cells[1].querySelector('textarea').value || '').replace(/"/g, '""') + '",';
            csvContent += (cells[2].querySelector('input').value || '0') + ',';
            csvContent += (cells[3].querySelector('input').value || '0.00') + ',';
            csvContent += (cells[4].querySelector('input').value || '0.00') + '\n';
        }
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'timesheet_' + monthYear.toLowerCase().replace(/\s+/g, '_') + '.csv');
}

// Export to Excel (.xlsx) - creates an Excel-compatible HTML
function exportToExcel() {
    const table = document.getElementById('timesheetTable');
    const rows = table.querySelectorAll('tbody tr');
    const monthYear = document.getElementById('pageTitle').textContent.replace('Timesheet - ', '');
    
    let excelContent = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
    excelContent += '<head>';
    excelContent += '<meta charset="utf-8">';
    excelContent += '<xml>';
    excelContent += '<x:ExcelWorkbook>';
    excelContent += '<x:ExcelWorksheets>';
    excelContent += '<x:ExcelWorksheet>';
    excelContent += '<x:Name>Timesheet</x:Name>';
    excelContent += '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>';
    excelContent += '</x:ExcelWorksheet>';
    excelContent += '</x:ExcelWorksheets>';
    excelContent += '</x:ExcelWorkbook>';
    excelContent += '</xml>';
    excelContent += '</head><body>';
    excelContent += '<table>';
    
    excelContent += '<tr><td colspan="5" style="text-align:center;font-weight:bold;font-size:16px;">' + monthYear + '</td></tr>';
    excelContent += '<tr></tr>';
    
    excelContent += '<tr>';
    excelContent += '<th>Date</th>';
    excelContent += '<th>Description</th>';
    excelContent += '<th>Minutes</th>';
    excelContent += '<th>Hours (Decimal)</th>';
    excelContent += '<th>Amount (EUR)</th>';
    excelContent += '</tr>';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const isTotal = row.classList.contains('total-row');
        
        excelContent += '<tr>';
        if (isTotal) {
            excelContent += '<td style="font-weight:bold;">' + cells[0].textContent + '</td>';
            excelContent += '<td></td>';
            excelContent += '<td style="font-weight:bold;">' + cells[2].textContent + '</td>';
            excelContent += '<td style="font-weight:bold;">' + cells[3].textContent + '</td>';
            excelContent += '<td style="font-weight:bold;">' + cells[4].textContent.replace('€', '') + '</td>';
        } else {
            excelContent += '<td>' + cells[0].textContent + '</td>';
            excelContent += '<td>' + (cells[1].querySelector('textarea').value || '') + '</td>';
            excelContent += '<td>' + (cells[2].querySelector('input').value || '0') + '</td>';
            excelContent += '<td>' + (cells[3].querySelector('input').value || '0.00') + '</td>';
            excelContent += '<td>' + (cells[4].querySelector('input').value || '0.00') + '</td>';
        }
        excelContent += '</tr>';
    });
    
    excelContent += '</table></body></html>';
    
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    downloadFile(blob, 'timesheet_' + monthYear.toLowerCase().replace(/\s+/g, '_') + '.xls');
}

// Export to PDF
function exportToPDF() {
    const monthYear = document.getElementById('pageTitle').textContent.replace('Timesheet - ', '');
    
    // Create new jsPDF instance
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(monthYear, 105, 20, { align: 'center' });
    
    // Prepare table data
    const headers = [['Date', 'Description', 'Minutes', 'Hours', 'Amount (EUR)']];
    const data = [];
    
    const rows = document.querySelectorAll('#timesheetTable tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const isTotal = row.classList.contains('total-row');
        
        if (isTotal) {
            data.push([
                cells[0].textContent,
                '',
                cells[2].textContent,
                cells[3].textContent,
                cells[4].textContent.replace('€', '')
            ]);
        } else {
            data.push([
                cells[0].textContent,
                cells[1].querySelector('textarea').value || '',
                cells[2].querySelector('input').value || '0',
                cells[3].querySelector('input').value || '0.00',
                cells[4].querySelector('input').value || '0.00'
            ]);
        }
    });
    
    // Add table
    doc.autoTable({
        head: headers,
        body: data,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [249, 249, 249] },
        didParseCell: function(data) {
            if (data.row.index === data.table.body.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [233, 236, 239];
            }
        }
    });
    
    // Save PDF
    doc.save('timesheet_' + monthYear.toLowerCase().replace(/\s+/g, '_') + '.pdf');
}

// Export to HTML
function exportToHTML() {
    const table = document.getElementById('timesheetTable');
    const rows = table.querySelectorAll('tbody tr');
    const monthYear = document.getElementById('pageTitle').textContent.replace('Timesheet - ', '');
    
    let htmlContent = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
    htmlContent += '<meta charset="UTF-8">\n';
    htmlContent += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    htmlContent += '<title>' + monthYear + '</title>\n';
    htmlContent += '<style>\n';
    htmlContent += 'body { font-family: Arial, sans-serif; margin: 20px; }\n';
    htmlContent += 'h1 { text-align: center; color: #333; }\n';
    htmlContent += 'table { width: 100%; border-collapse: collapse; margin: 20px 0; }\n';
    htmlContent += 'th { background-color: #C8C8C8; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }\n';
    htmlContent += 'td { padding: 8px; border: 1px solid #ddd; }\n';
    htmlContent += 'tr:nth-child(even) { background-color: #f9f9f9; }\n';
    htmlContent += '.total-row { background-color: #e9ecef; font-weight: bold; }\n';
    htmlContent += '.total-row td { border-top: 2px solid #C8C8C8; }\n';
    htmlContent += '.weekend { background-color: #f0f0f0; }\n';
    htmlContent += '.text-center { text-align: center; }\n';
    htmlContent += '.text-right { text-align: right; }\n';
    htmlContent += '</style>\n</head>\n<body>\n';
    htmlContent += '<h1>' + monthYear + '</h1>\n';
    htmlContent += '<table>\n<thead>\n<tr>\n';
    htmlContent += '<th>Date</th>\n';
    htmlContent += '<th>Description</th>\n';
    htmlContent += '<th class="text-center">Minutes</th>\n';
    htmlContent += '<th class="text-center">Hours (Decimal)</th>\n';
    htmlContent += '<th class="text-right">Amount (EUR)</th>\n';
    htmlContent += '</tr>\n</thead>\n<tbody>\n';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const isTotal = row.classList.contains('total-row');
        const isWeekend = row.classList.contains('weekend');
        
        if (isTotal) {
            htmlContent += '<tr class="total-row">\n';
            htmlContent += '<td>' + cells[0].textContent + '</td>\n';
            htmlContent += '<td></td>\n';
            htmlContent += '<td class="text-center">' + cells[2].textContent + '</td>\n';
            htmlContent += '<td class="text-center">' + cells[3].textContent + '</td>\n';
            htmlContent += '<td class="text-right">' + cells[4].textContent + '</td>\n';
        } else {
            htmlContent += '<tr' + (isWeekend ? ' class="weekend"' : '') + '>\n';
            htmlContent += '<td>' + cells[0].textContent + '</td>\n';
            htmlContent += '<td>' + (cells[1].querySelector('textarea').value || '') + '</td>\n';
            htmlContent += '<td class="text-center">' + (cells[2].querySelector('input').value || '0') + '</td>\n';
            htmlContent += '<td class="text-center">' + (cells[3].querySelector('input').value || '0.00') + '</td>\n';
            htmlContent += '<td class="text-right">€' + (cells[4].querySelector('input').value || '0.00') + '</td>\n';
        }
        htmlContent += '</tr>\n';
    });
    
    htmlContent += '</tbody>\n</table>\n</body>\n</html>';
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    downloadFile(blob, 'timesheet_' + monthYear.toLowerCase().replace(/\s+/g, '_') + '.html');
}

// Helper function to download files
function downloadFile(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
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
        savePaymentSettings();
        saveTableData();
    });
    
    document.getElementById('monthlyPay').addEventListener('change', () => {
        const rows = document.querySelectorAll('#timesheetTable tbody tr:not(.total-row)');
        rows.forEach(row => calculateAmount(row));
        updateTotals();
        savePaymentSettings();
        saveTableData();
    });
    
    document.getElementById('minDailyHours').addEventListener('change', () => {
        const rows = document.querySelectorAll('#timesheetTable tbody tr:not(.total-row)');
        rows.forEach(row => calculateAmount(row));
        updateTotals();
        savePaymentSettings();
        saveTableData();
    });
    
    // Add event listener for show hour diff checkbox
    document.getElementById('showHourDiff').addEventListener('change', () => {
        updateTotals();
        savePaymentSettings();
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPaymentSettings();
    initializeMonthPicker();
    initializePaymentMode();
});