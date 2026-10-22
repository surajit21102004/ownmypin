# ownMyPin 📌

A full-stack mobile application built with **Expo & React Native (JavaScript)** frontend and a **Node.js Express & MySQL** backend.

---

## 📁 Repository Structure

```
ownmypin/
├── app/                          # Expo React Native App (JavaScript)
│   ├── assets/                   # App icons, splash screens
│   ├── src/
│   │   ├── components/           # UI Components (Header, StatusCard, ProjectStructureCard)
│   │   ├── constants/            # Theme tokens (colors, spacing, typography)
│   │   ├── screens/              # App Screens (HomeScreen)
│   │   └── services/             # Backend API client & health check
│   ├── App.js                    # Root React Native Component
│   ├── app.json                  # Expo Configuration (name: "ownMyPin", slug: "ownmypin")
│   └── package.json
│
├── be/                           # Node.js & Express Backend Server
│   ├── scripts/
│   │   └── test-db.js            # Standalone MySQL connection test runner
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js             # MySQL2 connection pool & test helper
│   │   ├── middleware/
│   │   │   └── errorHandler.js   # Centralized error handling
│   │   ├── routes/
│   │   │   ├── api.routes.js     # API route definitions
│   │   │   └── health.routes.js  # Server & DB health status endpoints
│   │   └── server.js             # Express application entry point
│   ├── .env                      # Database & server credentials (git-ignored)
│   ├── .env.example              # Template environment variables
│   └── package.json
│
├── .gitignore                    # Git ignore file for workspace
├── package.json                  # Workspace script runner
└── README.md
```

---

## 🗄️ Database Configuration

Configured in `be/.env`:

```ini
DB_HOST=s1-nnvp.crazzydns.com
DB_PORT=3306
DB_USER=ecompone_sasthayu
DB_PASSWORD=Surajit@21
DB_NAME=ecompone_ownmypin
```

### Test Database Connection:
```bash
npm run test:db
# or from be/:
cd be
node scripts/test-db.js
```

---

## 🚀 Getting Started

### 1. Run Backend Server (`be`)
```bash
# From root directory:
npm run dev:be

# Or navigate directly:
cd be
npm run dev
```
The server will start at: `http://localhost:5000`
- API Health Endpoint: `http://localhost:5000/api/health`
- MySQL Database Check: `http://localhost:5000/api/health/db`

### 2. Run Expo Mobile App (`app`)
```bash
# From root directory:
npm run start:app

# Or navigate directly:
cd app
npx expo start
```
From the Expo terminal:
- Press **`a`** to run on Android emulator or connected device
- Press **`i`** to run on iOS simulator (macOS)
- Press **`w`** to run on Web browser
- Or scan the QR code with **Expo Go** on your physical phone (make sure phone and PC are on the same Wi-Fi, and configure the Backend API URL to your PC's LAN IP).
