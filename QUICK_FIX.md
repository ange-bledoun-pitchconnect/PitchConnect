# 🚀 Quick Fix - Prisma EPERM Error

## 🚨 You're Getting This Error?

```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...'
```

## ✅ **FASTEST FIX (30 seconds)**

### Option 1: Run the Batch Script (EASIEST)

```cmd
C:\Users\Hazye\PitchConnect V1> fix-and-build.bat
```

**That's it!** The script will:
- Kill Node processes
- Clean Prisma cache
- Rebuild everything
- Start your dev server

---

### Option 2: Manual Quick Fix (2 minutes)

Open Command Prompt and run these commands in order:

```cmd
REM Kill Node
taskkill /IM node.exe /F /Q

REM Wait
timeout /t 2

REM Clear Prisma cache
rmdir /s /q node_modules\.prisma

REM Regenerate
npm run prisma:generate

REM Build
set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

REM Run
npm run dev
```

---

## 🎯 **If that doesn't work:**

```cmd
REM Kill processes
taskkill /IM node.exe /F /Q

REM Delete node_modules
rmdir /s /q node_modules

REM Delete cache files
del package-lock.json

REM Clean npm
npm cache clean --force

REM Reinstall
npm install

REM Retry build
set NODE_OPTIONS=--max-old-space-size=4096 && npm run build && npm run dev
```

---

## 📋 **Common Causes & Quick Checks**

### ✅ Node process still running?
```cmd
tasklist | findstr node
```

### ✅ Antivirus blocking?
- Check Windows Defender is not scanning `node_modules`
- Add project folder to whitelist

### ✅ Low disk space?
```cmd
diskpart
list disk
```

You need **at least 5GB free space**

### ✅ Wrong Node version?
```cmd
node --version
npm --version
```

Should be: **Node 20.0.0+** and **npm 10.0.0+**

---

## 🎯 **If you're still stuck:**

Read the full guide:
```
WINDOWS_PRISMA_FIX.md
```

It has:
- 5 different solutions
- Debugging tips
- Nuclear reset option

---

## ✨ **Success looks like:**

```
✓ Generated Prisma Client
✓ Compiled successfully
✓ Build Complete
✓ Ready in 2.5s
✓ Local: http://localhost:3000
```

**Then open http://localhost:3000 in your browser!** 🚀⚽
