# CIMCO MDC Dashboard - Installation Guide

> This dashboard is **read-only**. It only reads data from the existing CIMCO MDC database — no data is created, modified, or deleted.

---

## Quick Start (3 Steps)

### Step 1: Extract the Package

Extract the ZIP to a folder, for example:
- `C:\CimcoDashboard\`
- or `D:\CimcoDashboard\`

After extraction you should see:

```
CimcoDashboard\
├── node\              ← Portable Node.js (Full 包, no install needed)
│   ├── node.exe
│   ├── npm.cmd
│   └── ...
├── dist\              ← Frontend files (do not modify)
├── server\
│   └── dist\          ← Backend API server (compiled)
├── node_modules\      ← Dependencies (do not modify)
├── .env.example       ← Configuration template
├── install.bat        ← First-time setup
├── start.bat          ← Daily startup (with command window)
├── launch.vbs         ← ★ One-click start (recommended)
├── verify.bat         ← Troubleshooting tool
├── INSTALL.md         ← This file
├── README.md          ← Full documentation
└── package.json
```

> **Note:** Lite 包不含 `node\` 目录，需要系统已安装 Node.js。Full 包自带 portable Node.js，无需安装。

### Step 2: Run the Installer (First Time)

Double-click **`install.bat`**

The installer will automatically:
1. Detect Node.js (bundled portable or system installed)
2. Verify npm is working
3. Check all dependencies
4. Let you configure the database connection
5. Run a quick health check

### Step 3: Configure Database

During installation, you will be prompted to review the `.env` file. Update these values to match your CIMCO MDC database:

```ini
DB_HOST=localhost          ← MariaDB server IP address
DB_PORT=3306               ← MariaDB port (default: 3306)
DB_USER=root               ← Database username
DB_PASSWORD=cimco123       ← Database password
DB_NAME=MDC                ← Database name (default: MDC)
SERVER_PORT=3002           ← Dashboard web port
```

**Common scenarios:**
- MariaDB on the same machine: `DB_HOST=localhost`
- MariaDB on another server: `DB_HOST=192.168.1.100` (use actual IP)
- Custom port: change `SERVER_PORT=8080`

**That's it!** The installer will offer to start the dashboard immediately.

---

## Daily Use

| Action            | How                                                        |
|-------------------|------------------------------------------------------------|
| **Start**         | Double-click `launch.vbs` (recommended) or `start.bat` |
| **Stop**          | Close the command window, or find `node.exe` in Task Manager |
| **Restart**       | Stop and start again                                        |
| **Change settings** | Edit `.env`, then restart                                |

---

## Machine Name Configuration

To customize machine display names, add `MACHINE_NAMES` to your `.env` file:

```ini
MACHINE_NAMES={"1":"CNC Lathe #1","2":"CNC Mill #2","3":"Drill Press #3"}
```

The JSON maps `portid` values to display names. After editing `.env`, restart the dashboard.

---

## Troubleshooting

### Run the Verification Tool

Double-click **`verify.bat`** to check package integrity. It tests:
- Node.js availability
- Frontend files (dist/)
- Server files (server/dist/)
- Dependencies (express, mysql2)
- Configuration (.env)
- Package manifest (package.json)

Screenshot the output and send to technical support if you need help.

### Dashboard starts but shows no data

1. Verify MariaDB is running on the configured host/port
2. Check the command window for error messages like "ECONNREFUSED"
3. Check `.env` database credentials

### "ECONNREFUSED" or "Access denied"

- `ECONNREFUSED`: MariaDB is not running or wrong host/port
- `Access denied`: Wrong username or password in `.env`
- `Unknown database`: Wrong `DB_NAME` in `.env`

### Port already in use

Error: `EADDRINUSE: address already in use :::3002`

Solution: Change `SERVER_PORT` in `.env` to another port (e.g., `8080`), then restart.

---

## Access from Other Computers

The dashboard is accessible from any computer on the same network.

1. Find this computer's IP: open Command Prompt and run `ipconfig`
2. Look for the **IPv4 Address** (e.g., `192.168.1.50`)
3. On other computers, open browser and go to:

```
http://192.168.1.50:3002
```

**If it doesn't work**, check Windows Firewall:
1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → TCP → Specific port: `3002`
4. Allow the connection → Apply to all profiles
5. Name: "CIMCO Dashboard"

---

## Auto-Start on Boot

1. Open **Task Scheduler** (search in Start menu)
2. Click "Create Basic Task"
3. Name: `CIMCO Dashboard`
4. Trigger: "When the computer starts"
5. Action: "Start a program"
   - Program: `C:\CimcoDashboard\launch.vbs`
   - Start in: `C:\CimcoDashboard`
6. Check "Open Properties when finished" → change "Run whether user is logged on or not"
