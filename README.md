# Timesheet Invoice App

A simple, elegant web application for tracking work hours and automatically calculating payments. Perfect for freelancers, consultants, and anyone who needs to track billable hours.

## Features

### 📅 Monthly Time Tracking
- Select any month/year with an intuitive date picker
- Automatically generates a table with the correct number of days
- Weekends are visually highlighted

### 💰 Flexible Payment Modes
Choose between two payment calculation methods:

1. **Hourly Rate Mode**
   - Simple calculation: hours worked × hourly rate
   - Default rate: €15/hour (customizable)

2. **Daily Minimum Mode**
   - Set a monthly salary and minimum daily hours
   - If you work ≥ minimum hours: get daily rate (monthly salary ÷ working days)
   - If you work < minimum hours: get paid hourly
   - Shows hour difference from expected (+/- hours)

### ✏️ User-Friendly Interface
- **Auto-expanding text areas** for job descriptions
- **Automatic calculations** between minutes and hours
- **Editable amounts** - override automatic calculations when needed
- **Clean, responsive design** that works on all devices

### 💾 Auto-Save Everything
- All data is automatically saved to browser localStorage
- Each month's data is stored separately
- Payment settings are remembered
- No data loss on page refresh or browser restart

### 📊 Export to Word
- Export your timesheet as a formatted .doc file
- Includes all styling and table formatting
- File named with month and year for easy organization
- Ready to send to clients or include in invoices

## How to Use

1. **Select a Month**: Use the month picker to choose which month you're tracking
2. **Choose Payment Mode**: Select either "Hourly rate" or "Daily minimum"
3. **Enter Your Work**:
   - Add job descriptions
   - Enter either minutes or hours (they auto-convert)
   - Amount is calculated automatically (or enter manually)
4. **Export**: Click "Export Table" to download a Word document

## Installation

### Option 1: Use Directly
Simply open `index.html` in your web browser. No installation needed!

### Option 2: Deploy to Cloudflare Pages
1. Upload the three files (index.html, style.css, script.js) to Cloudflare Pages
2. Access your timesheet from anywhere
3. Data stays private in your browser

### Option 3: Host on Any Web Server
The app is pure HTML/CSS/JavaScript - works on any static hosting service.

## Technical Details

- **No Backend Required**: All data stored locally in browser
- **No Dependencies**: Pure vanilla JavaScript
- **Responsive Design**: Works on desktop and mobile
- **Privacy First**: Your data never leaves your device

## Files

- `index.html` - Main application structure
- `style.css` - All styling and responsive design
- `script.js` - Application logic and calculations

## Browser Compatibility

Works on all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## License

Free to use for personal and commercial purposes.

---

Made with ❤️ for freelancers and consultants who value their time.