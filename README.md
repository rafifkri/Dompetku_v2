<div align="center">

<img src="client/public/logo.png" alt="Dompetku" width="420">

**Personal Monthly Finance Dashboard**

Track income and expenses, manage budgets, set financial goals, and understand monthly spending.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003b57?logo=sqlite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-cloud%20storage-3ecf8e?logo=supabase&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4-ff6384?logo=chartdotjs&logoColor=white)

</div>

---

## Table of Contents

1. [About](#1-about)
2. [Features](#2-features)
3. [Technology](#3-technology)
4. [Project Structure](#4-project-structure)
5. [Requirements](#5-requirements)
6. [Installation and Development](#6-installation-and-development)
7. [Configuration](#7-configuration)
8. [Usage Guide](#8-usage-guide)
9. [Data Architecture](#9-data-architecture)
10. [Database](#10-database)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Deployment](#12-deployment)
13. [Backup and Restore](#13-backup-and-restore)
14. [Security](#14-security)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. About

Dompetku is a React-based personal finance application for monthly planning and
tracking. Dashboard totals and charts are calculated from the transactions
entered by the user. The currency format is Indonesian Rupiah (IDR), for
example `Rp1.000.000`.

The application supports two persistence modes:

| Mode | Storage | Use case |
|---|---|---|
| Supabase | Cloud database and Supabase Auth | Production, multi-device accounts |
| Express | Node.js, Express, and SQLite | Self-hosted deployments |
| Static fallback | Browser `localStorage` | Demo or offline local development |

The deployed GitHub Pages workflow is configured to use Supabase. The static
fallback is used only when Supabase and an API URL are not configured.

## 2. Features

### Dashboard and Calendar

- Balance, income, expense, and transaction summary cards.
- Interactive monthly calendar with month and year selectors.
- Daily income and expense charts.
- Category spending doughnut chart and spending trend chart.
- Payment-method chart with separate Cash, Transfer, E-Wallet, QRIS, and Other
  views.
- Latest transactions and monthly insights.
- Budget usage warnings beginning at 80% usage.
- Current-month comparison with the previous month.

### Transactions and History

- Add, edit, and delete income or expense transactions.
- Payment methods: Cash, Transfer, E-Wallet, and Other.
- QRIS is available as a payment method.
- Rupiah amount fields format thousands automatically while typing (for example
  `1000` becomes `1.000`).
- Dynamic subcategories based on the selected category.
- Search by name or description.
- Filter by transaction type, category, selected month, or all months.
- Validation for positive amounts, valid dates, categories, and descriptions.

### Budgets, Goals, and Recurring Transactions

- Monthly budget limits per category with usage indicators.
- Financial goals with target amount, progress, and deadline.
- Edit goal name, target amount, accumulated amount, and deadline.
- Delete goals when they are no longer needed.
- Monthly recurring transactions with active/inactive status.
- Active recurring transactions are generated once per month.
- Budget notifications are available from the application header.

### Categories and Icons

- Add, edit, and delete income and expense categories.
- Add and edit category subcategories.
- Renaming a category updates related transactions and budgets.
- Category, edit, delete, search, profile, greeting, calendar, and theme
  controls use the provided white PNG icon assets.
- Category icon mappings are maintained in `client/src/categoryIcons.js`.

### Accounts and Profile

- Registration, login, logout, and session restoration.
- Editable name, email, bio, avatar, and cover image.
- Drag, touch, pinch, zoom, and reset controls for profile image positioning.
- Profile data is synchronized between devices in Supabase mode.
- First-time users receive a one-time onboarding guide.

### Themes and Interface

- Light and dark themes with a single theme switch.
- The light theme uses a dark switch with the sun on the right.
- The dark theme uses a bright switch with the moon on the left.
- Active theme and automatic persistence status are shown in Settings.
- Responsive desktop, tablet, and mobile layouts.
- Sidebar navigation changes to a compact mobile navigation layout.

### Analysis and Data Management

- Automatic insights for largest categories, frequent categories, daily
  averages, highest-spending days, savings percentage, and income versus
  expenses.
- Monthly summary comparison table.
- CSV export for spreadsheets.
- The CSV export is generated from the current in-memory transaction state;
  download it again after deleting or editing transactions to get the latest
  snapshot.
- JSON backup and restore, including transactions, budgets, categories, goals,
  and recurring transactions.
- Reset-all-data action with confirmation.

## 3. Technology

| Area | Packages |
|---|---|
| UI | `react`, `react-dom` |
| Build | `vite`, `@vitejs/plugin-react` |
| Charts | `chart.js`, `react-chartjs-2` |
| API server | `express` |
| Local database | `better-sqlite3` |
| Cloud database and auth | `@supabase/supabase-js` |

## 4. Project Structure

```text
dompetku/
├── server.js                  # Express API and SQLite implementation
├── package.json               # Root scripts and server dependencies
├── supabase/
│   └── schema.sql             # Supabase tables, grants, RLS, and trigger
├── .github/workflows/
│   └── pages.yml              # GitHub Pages and Supabase build workflow
├── client/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx            # Application shell, navigation, onboarding
│       ├── api.js             # Supabase, API, and local fallback adapters
│       ├── store.jsx          # Finance state and persistence actions
│       ├── ui.jsx             # Toasts, dialogs, and theme state
│       ├── defaults.js        # Default categories and application data
│       ├── categoryIcons.js   # Category-to-PNG icon registry
│       ├── styles.css         # Theme, layout, and component styles
│       ├── assets/icons/      # White interface and category PNG assets
│       ├── components/        # Shared UI components
│       └── pages/
│           ├── Dashboard.jsx
│           ├── History.jsx
│           ├── Categories.jsx
│           ├── Budget.jsx
│           ├── Goals.jsx
│           ├── Recurring.jsx
│           ├── Analysis.jsx
│           ├── Profile.jsx
│           └── Settings.jsx
└── standalone/
    └── dompetku.html           # Single-file localStorage version
```

## 5. Requirements

- Node.js 18 or newer.
- npm.
- Internet access for installing dependencies.
- For Supabase mode: a Supabase project and the SQL schema applied.
- For SQLite mode: a host with persistent disk storage.

## 6. Installation and Development

### Install all dependencies

```bash
npm run install:all
```

### Run the Express application

```bash
npm run build
npm start
```

Open `http://localhost:3000`.

### Run with hot reload

Use two terminals:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run client
```

Open `http://localhost:5173`. Vite proxies `/api/*` to the server on port
3000.

### Available scripts

| Command | Description |
|---|---|
| `npm run install:all` | Install root and client dependencies |
| `npm run build` | Build the frontend into `client/dist` |
| `npm start` | Start the production server |
| `npm run server` | Start the backend in development |
| `npm run client` | Start the Vite development server |

## 7. Configuration

### Backend and SQLite variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Express server port |
| `DB_FILE` | `./data/dompetku.db` | SQLite database path |
| `APP_PASSWORD` | empty | Optional additional Basic Auth password |

### Supabase variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable or anonymous key |
| `VITE_API_URL` | Optional Express API URL |
| `VITE_STATIC` | Set to `true` only for an intentional localStorage build |

Do not put a Supabase service-role key in frontend code. The publishable/anon
key is intended for browser use and must be protected by Row Level Security.

For a local Supabase build in PowerShell:

```powershell
cd client
$env:VITE_SUPABASE_URL="https://project-id.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="sb_publishable_..."
$env:VITE_STATIC="false"
npm run build
```

## 8. Usage Guide

1. Register or sign in.
2. Select a month and year from the calendar controls.
3. Optionally set an opening balance in **Settings**.
4. Customize categories and subcategories.
5. Add income and expense transactions.
6. Set category budgets and review their usage indicators.
7. Create financial goals and track progress.
8. Add recurring transactions for monthly items.
9. Review dashboard charts, analysis insights, and notifications.
10. Export a CSV or JSON backup regularly.

## 9. Data Architecture

```text
React UI
   |
   +-- Supabase configured --> Supabase Auth + profiles + transactions + settings
   |
   +-- API configured ------> Express + SQLite
   |
   +-- No remote storage ----> localStorage fallback
```

- `store.jsx` owns finance state and calls the persistence adapter.
- `api.js` selects Supabase, Express, or localStorage based on environment
  configuration.
- Summary cards, charts, and insights are derived in the frontend.
- Supabase records are scoped to the authenticated user through RLS.
- Recurring transactions are generated at most once per calendar month.

## 10. Database

### Supabase

Run [supabase/schema.sql](./supabase/schema.sql) in the Supabase SQL Editor.
It creates:

- `profiles`: account profile and image positioning data.
- `transactions`: income and expense rows.
- `settings`: JSON values for balance, budgets, categories, goals, and
  recurring transactions.

The schema enables Row Level Security and grants each authenticated user access
only to their own rows. It also creates a trigger that creates a profile after
registration.

### SQLite

The Express implementation stores users, sessions, transactions, and settings
in `data/dompetku.db`. Keep the database file and its WAL files on persistent
storage in production.

## 11. Frontend Architecture

- `useFinance()` in `store.jsx` exposes finance data, selected month data,
  transaction actions, settings updates, restore, goals, and recurring data.
- `useUI()` in `ui.jsx` exposes toast/dialog helpers and theme state.
- `App.jsx` provides the application shell, route-like page selection,
  onboarding, and notification center.
- `components/` contains reusable rows, cards, forms, icons, and modals.
- `pages/` contains one page component per major application area.
- CSS variables in `styles.css` define light and dark theme tokens.

To add a page, create a component in `client/src/pages`, register it in
`App.jsx`, and add its navigation entry to the sidebar.

## 12. Deployment

### GitHub Pages with Supabase

The workflow in `.github/workflows/pages.yml` builds and deploys the frontend
to GitHub Pages. Configure these GitHub Actions **Variables**:

```text
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Then:

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. Configure Supabase Authentication providers and email confirmation.
3. Set GitHub Pages source to **GitHub Actions**.
4. Push to `master` or `main`.

The current workflow sets `VITE_STATIC=false`, so configured Supabase variables
are used for cloud persistence. If they are missing, the application falls
back to browser storage.

### Self-hosted Express and SQLite

```bash
npm run install:all
npm run build
npm install -g pm2
PORT=3000 pm2 start server.js --name dompetku
pm2 save
```

Use HTTPS through Nginx or Caddy and mount persistent storage for `DB_FILE`.

## 13. Backup and Restore

From the application, open **Settings** and use:

- **Download CSV** for spreadsheet reports.
- **Download JSON Backup** for a complete application backup.
- File or text restore for importing a JSON backup.
- **Delete all data** to reset the current account after confirmation.

The JSON backup includes transactions, opening balance, budgets, goals,
recurring transactions, and categories. A local SQLite deployment should also
back up `data/dompetku.db` and its `-wal`/`-shm` files when present.

Data stored in a browser-only fallback is not synchronized between devices and
can be lost when site data is cleared. Existing localStorage data is not
automatically migrated when switching to Supabase.

## 14. Security

- Supabase tables use Row Level Security policies tied to `auth.uid()`.
- Never expose a Supabase service-role key in frontend code.
- Use HTTPS for any public Express deployment.
- Passwords and sessions are handled by Supabase Auth or the Express backend.
- Backend and cloud adapters validate transaction values and dates.
- React escapes rendered user text.
- Keep backups private because they contain financial data.

## 15. Troubleshooting

| Problem | Solution |
|---|---|
| The app shows “Demo mode” | Supabase/API variables are not available in the build. Configure them and rebuild. |
| Supabase requests fail | Run `supabase/schema.sql`, verify the project URL/key, and check Auth settings. |
| Data does not appear on another device | Confirm the user signed in through Supabase rather than localStorage fallback. |
| `npm install` fails for `better-sqlite3` | Use Node.js 18+ and install platform build tools if no prebuilt binary exists. |
| `Server not reachable` | Start the backend with `npm start` or `npm run server`. |
| `Cannot GET /` | Build the frontend with `npm run build` before starting the production server. |
| `EADDRINUSE` | Use another port, for example `PORT=3001 npm start`. |
| A deployed change is not visible | Hard-refresh with `Ctrl+Shift+R` and wait for the Pages workflow to finish. |
