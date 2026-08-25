# 🏪 SuperMart POS System

A full-featured, production-ready Point-of-Sale system for retail stores.
Built with **React + Vite** (frontend) and **Node.js + Express + SQLite** (backend).

---

## ✨ Features

| Module | Features |
|---|---|
| **POS Terminal** | Product grid, barcode search, cart, discounts, multi-payment, receipt |
| **Inventory** | Stock levels, low-stock alerts, stock adjustments, product CRUD |
| **Customers** | Customer profiles, purchase history, loyalty points, credit limits |
| **Reports** | Daily/monthly analytics, revenue charts, top products, payment breakdown |
| **Settings** | Store info, user management (roles), categories, receipt customization |
| **Auth** | JWT login, role-based access (Admin / Manager / Cashier) |

---

## 📁 Project Structure

```
supermart-pos/
├── backend/                  ← Node.js + Express API
│   ├── db/
│   │   ├── init.js           ← SQLite schema (all tables)
│   │   └── seed.js           ← Sample data seeder
│   ├── middleware/
│   │   └── auth.js           ← JWT middleware
│   ├── routes/
│   │   ├── auth.js           ← Login, /me
│   │   ├── products.js       ← CRUD + stock adjust
│   │   ├── transactions.js   ← Checkout, history, void
│   │   ├── reports.js        ← Dashboard, range, movements
│   │   └── misc.js           ← Categories, customers, users, settings
│   ├── .env                  ← Environment config
│   └── server.js             ← Express entry point
│
├── frontend/                 ← React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── POS/          ← POSTerminal, CartPanel, Receipt
│   │   │   ├── Inventory/    ← Inventory, modals
│   │   │   ├── Customers/    ← Customer list, detail
│   │   │   ├── Reports/      ← Dashboard, charts
│   │   │   ├── Settings/     ← Store config, users, categories
│   │   │   └── Layout/       ← Sidebar navigation
│   │   ├── pages/
│   │   │   └── Login.jsx
│   │   ├── store/
│   │   │   └── index.js      ← Zustand (auth + cart state)
│   │   ├── utils/
│   │   │   ├── api.js        ← Axios client
│   │   │   └── helpers.js    ← Formatters
│   │   ├── App.jsx           ← Routes
│   │   ├── main.jsx
│   │   └── index.css         ← Design system tokens
│   └── index.html
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Setup Backend
```bash
cd backend
npm install
npm run seed          # Creates DB and loads sample data
npm run dev           # Starts on http://localhost:5000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev           # Starts on http://localhost:3000
```

### 3. Login
Open **http://localhost:3000** and use:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@supermart.pk | admin123 |
| Cashier | ali@supermart.pk | cashier123 |
| Manager | inv@supermart.pk | inv123 |

---

## 🏗️ Production Build

```bash
# Build frontend
cd frontend && npm run build

# Serve the frontend build with a static server (nginx, Caddy, or serve)
# Example (serve package): npx serve frontend/dist

# Backend: run with a process manager (pm2, systemd) and set required env vars
# Example (pm2):
#   export JWT_SECRET="a-very-secret-string"
#   export DB_PATH="/var/lib/supermart/supermart.db"
#   export FRONTEND_ORIGINS="https://shop.example.com"
#   pm2 start backend/server.js --name supermart-pos --env production
```

---

## ⚙️ Required environment variables (production)

- JWT_SECRET — A long random string used to sign JWTs (required).
- DB_PATH — Absolute path to SQLite DB file (optional, default: ./db/supermart.db).
- FRONTEND_ORIGINS — Comma-separated origins allowed for CORS (e.g. https://app.example.com).
- NODE_ENV — Set to "production" in production.
- PORT — Backend port (default 5000).

Make sure to keep JWT_SECRET secret. Rotate periodically.

---

## 🔐 Roles & Permissions

| Feature | Admin | Manager | Cashier |
|---------|-------|---------|---------|
| POS Terminal | ✅ | ✅ | ✅ |
| View Customers | ✅ | ✅ | ✅ |
| View Inventory | ✅ | ✅ | ❌ |
| Edit Products | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ❌ |
| Void Transactions | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Current user

### Products
- `GET  /api/products` — List all (supports ?search=, ?category=, ?low_stock=1)
- `POST /api/products` — Create
- `PUT  /api/products/:id` — Update
- `POST /api/products/:id/stock` — Adjust stock
- `GET  /api/products/barcode/:barcode` — Barcode lookup

### Transactions
- `POST /api/transactions` — Checkout
- `GET  /api/transactions` — History (supports ?date=, ?customer_id=)
- `GET  /api/transactions/:id` — Detail + items
- `DELETE /api/transactions/:id` — Void

### Reports
- `GET /api/reports/dashboard` — KPIs, charts, recent txns
- `GET /api/reports/range?from=&to=` — Date range analysis

### Others
- `/api/categories`, `/api/customers`, `/api/users`, `/api/settings`

---

## 🎨 Tech Stack

- **Frontend**: React 18, Vite, Zustand, React Router, Recharts, Axios, react-hot-toast
- **Backend**: Node.js, Express, better-sqlite3, JWT, bcryptjs, Helmet
- **Database**: SQLite (zero-config, file-based, portable)
- **Design**: Custom dark theme, DM Sans + Syne fonts, Tabler Icons

---

## 📦 Customization

- Change store name/logo: **Settings → Store Info**
- Add products: **Inventory → Add Product**
- Change tax rates: Per product or at checkout
- Add users: **Settings → Users**
- Add payment methods: Edit `PAY_METHODS` in `CartPanel.jsx`

---

## 📄 License

Commercial use allowed. Customize and resell freely.
Built for Pakistani retail market — PKR currency, GST tax support.
