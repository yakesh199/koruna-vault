# Koruna Vault

A modern, real-time expense tracker that converts Czech Koruna (CZK) to Indian Rupees (INR) with live exchange rates. Track your budget, categorize expenses, and manage your finances with an intuitive dark-themed interface.

## 🎯 Features

- **💰 Salary Management**: Set your monthly budget and track spending against it
- **📊 Real-Time Exchange Rates**: Live CZK to INR conversion using ExchangeRate-API
- **📈 Visual Analytics**: 
  - Monthly budget overview with progress ring
  - Pie chart breakdown by spending category
  - Area chart showing spending trends over time
- **💾 Persistent Storage**: Data automatically saved to browser localStorage (survives page refresh)
- **🏷️ Smart Categorization**: Organize expenses by custom categories
- **🗑️ Transaction Management**: Add, view, filter, and delete expenses
- **🎨 Dark Theme UI**: Sleek dark interface with gold accents for easy on-the-eyes tracking
- **🔄 Clear All Data**: End-of-month reset to start fresh

## 🚀 Live Demo

**[Visit Koruna Vault on Vercel](https://koruna-vault.vercel.app)**

## 📱 How It Works

### Getting Started
1. **Enter Monthly Salary**: Input your monthly salary in CZK - this becomes your budget
2. **Add Expenses**: Record each expense with description, category, and amount
3. **Track Spending**: View real-time breakdown by category and monthly progress
4. **Manage History**: Filter transactions by category or clear all data at month-end

### Data Flow
```
User Input → localStorage (Persistent Storage) → State (React) → UI Display
                ↓
         Real-time Exchange Rate API
                ↓
         INR Conversion & Display
```

### Key Components

**Overview Tab**
- Monthly budget progress ring (shows % spent vs. remaining)
- Total spent and remaining balance with INR conversion
- Pie chart: spending breakdown by category
- Area chart: spending trend over time
- Recent transactions list with delete options

**Add Expense Tab**
- Form to create new transactions
- Required fields: Date, Description, Category, Amount
- Auto-saves to localStorage on submission

**History Tab**
- View all transactions
- Filter by category
- Delete individual expenses
- Sorted by date (newest first)

## 💻 Technology Stack

- **Frontend**: React 19.2.4
- **Build Tool**: Vite 8.0.3 (Ultra-fast bundler)
- **Charts**: Recharts 3.8.1 (Beautiful data visualization)
- **Exchange Rates**: ExchangeRate-API (https://exchangerate-api.com)
- **Data Storage**: Browser localStorage (client-side, no backend)
- **Styling**: Pure CSS with CSS variables and dark theme
- **Animations**: Web Animations API with custom spring easing
- **Version Control**: Git & GitHub

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yakesh199/koruna-vault.git
cd koruna-vault
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```
The app will open at `http://localhost:5173`

4. **Build for production**
```bash
npm run build
```

## 📋 Project Structure

```
koruna-vault/
├── src/
│   ├── KorunaVault.jsx    # Main expense tracker component (520 lines)
│   ├── App.jsx            # Root wrapper component
│   ├── main.jsx           # React entry point
│   ├── App.css            # Component styles
│   ├── index.css          # Global styles
│   └── assets/            # Static assets
├── public/                # Static files
├── package.json           # Dependencies & scripts
├── vite.config.js         # Vite configuration
├── eslint.config.js       # Linting rules
├── index.html             # HTML entry point
└── README.md             # This file
```

## 🔑 API Integration

### Exchange Rate API
- **Provider**: ExchangeRate-API
- **Endpoint**: `https://v6.exchangerate-api.com/v6/{API_KEY}/latest/CZK`
- **Update Frequency**: On app launch (auto-fetches latest rate)
- **Conversion**: Displays all amounts in both CZK and INR
- **Fallback**: Default rate of 3.78 if API unavailable

## 💾 Data Storage

Data is stored in **browser localStorage** with two keys:

```javascript
// Monthly salary (number)
localStorage.setItem('korunaSalary', salary);

// Expenses array (JSON stringified)
localStorage.setItem('korunaExpenses', JSON.stringify(expenses));
```

**Data persists across:**
- Page refreshes
- Browser closing and reopening
- App updates (as long as localStorage isn't cleared)

**Data is cleared only when:**
- User clicks "Clear All Data" button
- Browser storage is manually cleared
- Browser is in incognito/private mode (temporary)

## 🎨 UI Features

- **Dark Theme**: #0a0a0f background with #e2c97e (gold) accents
- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: 
  - Number counters with easing effects
  - Card fade-in animations
  - Hover effects on buttons
- **Dark Dropdowns**: Custom-styled select options with dark background
- **Interactive Charts**: Hover tooltips with dark theme styling
- **Real-time Updates**: Instant UI refresh when expenses change

## 📊 Expense Categories

Pre-defined categories include:
- Food
- Transport
- Entertainment
- Utilities
- Shopping
- Health
- Other

Users can add custom categories as needed.

## ⚙️ Configuration

### Vite Config
- React plugin enabled with Babel compiler preset
- Fast refresh for development
- Optimized production build

### ESLint
- Code quality checks
- Run with: `npm run lint`

## 🚀 Deployment

### Hosted on Vercel
1. Repository: https://github.com/yakesh199/koruna-vault
2. Deployment: Automated from GitHub main branch
3. Live URL: https://koruna-vault.vercel.app
4. No manual deployment needed - push to GitHub = auto-deploy

## 📝 Usage Example

1. **Set Monthly Budget**: Enter ₹50,000 CZK salary
2. **Add Expense**: Create "Groceries" for ₹3,500 CZK
3. **View Breakdown**: See 7% spent, pie chart updates instantly
4. **Check INR Value**: Same expense shows as ≈₹1,323 INR (with live rate)
5. **Track Over Month**: Area chart shows spending trend
6. **Month End**: Click "Clear All Data" to reset for next month

## 🔐 Privacy & Security

- **No Server Storage**: All data stored locally in your browser
- **No Tracking**: No analytics or user tracking
- **No Accounts**: No login required
- **Offline Capable**: Works without internet after first load
- **Exchange Rates**: Fetched from external API (only real-time rate fetched)

## 🐛 Troubleshooting

**Q: Data disappeared after closing browser**
- A: Check if browser is in incognito/private mode (localStorage disabled)

**Q: Exchange rate not updating**
- A: Check internet connection or try refreshing page

**Q: Delete button not working**
- A: Try refreshing page; if persists, check browser console for errors

## 📞 Support

For issues or suggestions:
1. Check the [GitHub Issues](https://github.com/yakesh199/koruna-vault/issues)
2. Create a new issue with details and screenshots

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Budget Tracking!** 💎 Keep your finances in check with Koruna Vault.
