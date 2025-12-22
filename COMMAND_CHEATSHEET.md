# 💼 PitchConnect - Windows Command Cheatsheet
## Quick Reference for Common Tasks

---

## 🚀 **Getting Started (Every Day)**

```cmd
REM Navigate to project
cd C:\Users\Hazye\PitchConnect V1

REM Start development server (MOST COMMON)
npm run dev

REM Open in browser
start http://localhost:3000
```

---

## 🗑️ **Cleaning & Resetting**

```cmd
REM Clear Next.js build
rmdir /s /q .next

REM Clear npm cache
rmdir /s /q node_modules\.cache

REM Clear Prisma cache (if permission errors)
rmdir /s /q node_modules\.prisma

REM Delete all node_modules
rmdir /s /q node_modules

REM Delete lock file
del package-lock.json

REM Clear npm cache completely
npm cache clean --force

REM Complete reset
npm run clean:all
```

---

## 🔨 **Building & Compiling**

```cmd
REM Build for production
set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

REM Build with more memory
set NODE_OPTIONS=--max-old-space-size=8192 && npm run build

REM Run production build locally
npm start

REM Type checking only
npm run type-check

REM Lint code
npm run lint

REM Fix linting issues
npm run lint:fix

REM Format code
npm run format
```

---

## 📊 **Prisma Database**

```cmd
REM Generate Prisma client
npm run prisma:generate

REM Run migrations
npm run prisma:migrate

REM Push schema to database
npm run prisma:push

REM Pull schema from database
npm run prisma:pull

REM Open Prisma Studio (GUI)
npm run prisma:studio

REM Validate schema
npm run prisma:validate

REM Reset database (WARNING: deletes all data)
npm run prisma:reset

REM Seed database with test data
npm run prisma:seed
```

---

## 📋 **Dependencies & Packages**

```cmd
REM Install all packages
npm install

REM Install specific package
npm install package-name

REM Install as dev dependency
npm install --save-dev package-name

REM Remove package
npm uninstall package-name

REM List installed packages
npm list

REM Check for outdated packages
npm outdated

REM Update all packages
npm update

REM Check for security vulnerabilities
npm audit

REM Fix vulnerabilities
npm audit fix
```

---

## 🚟 **Kill & Stop Processes**

```cmd
REM Kill all Node processes
taskkill /IM node.exe /F

REM Find what's using a port
netstat -ano | findstr :3000

REM Kill process by ID (replace XXXX)
taskkill /PID XXXX /F

REM Kill process by name
taskkill /IM "node.exe" /F
```

---

## 🗗️ **File & Directory Operations**

```cmd
REM List files
dir

REM List files with details
dir /s

REM List files recursively
dir /s /b

REM Change directory
cd folder-name

REM Go up one level
cd ..

REM Go to root of drive
cd \

REM Print current directory
cd

REM Create folder
mkdir new-folder

REM Delete empty folder
rmdir folder

REM Delete folder with contents
rmdir /s /q folder

REM Delete file
del filename.txt

REM Copy file
copy source.txt destination.txt

REM Copy folder
copy /Y /S source\ destination\

REM Rename file
ren oldname.txt newname.txt

REM View file contents
type filename.txt

REM Search in file
findstr "search-text" filename.txt
```

---

## 🔍 **Environment & Debugging**

```cmd
REM View environment variables
set

REM Set environment variable
set VARIABLE_NAME=value

REM Set and run command
set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

REM Clear screen
cls

REM Print text
echo Hello World

REM Pause execution
pause

REM Print current user
echo %USERNAME%

REM Print current directory
echo %CD%
```

---

## 📔 **Git Operations**

```cmd
REM Check git status
git status

REM Add files
git add .

REM Commit
git commit -m "Your message"

REM Push to GitHub
git push

REM Pull latest changes
git pull

REM Create new branch
git checkout -b branch-name

REM Switch branch
git checkout branch-name

REM List branches
git branch

REM View commit history
git log --oneline
```

---

## 📄 **VS Code & Editor**

```cmd
REM Open current folder in VS Code
code .

REM Open specific file
code filename.tsx

REM Open on specific line
code filename.tsx:42
```

---

## 🔪 **Development Utilities**

```cmd
REM Run tests
npm test

REM Run tests in watch mode
npm run test:watch

REM Run specific test
npm test -- --testNamePattern="test name"

REM Run type check + lint + tests
npm run verify

REM Analyze bundle size
npm run analyze

REM Health check
npm run health-check

REM Check outdated dependencies
npm outdated
```

---

## 🚨 **Troubleshooting Commands**

```cmd
REM Check Node version
node --version

REM Check npm version
npm --version

REM Verify setup
npm run setup:fresh

REM Clear all caches and reinstall
rmdir /s /q .next .turbo node_modules
del package-lock.json
npm cache clean --force
npm install

REM Test Redis connection
npm run test:redis

REM Test Stripe integration
npm run test:stripe

REM Test email sending
npm run test:email
```

---

## 🚀 **Complete Workflow (Daily)**

### Morning (Start of day)
```cmd
REM Open project
cd C:\Users\Hazye\PitchConnect V1

REM Pull latest changes
git pull

REM Install any new dependencies
npm install

REM Start dev server
npm run dev

REM Open in browser
start http://localhost:3000
```

### During Development
```cmd
REM Files auto-refresh in browser when saved
REM Check console for errors
REM Make changes in src/ folder
REM Save files (Ctrl+S in VS Code)
```

### Before Committing
```cmd
REM Type check
npm run type-check

REM Lint and fix
npm run lint:fix

REM Format code
npm run format

REM Run tests
npm test
```

### Ready to Deploy
```cmd
REM Build for production
set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

REM Test production build locally
npm start

REM Commit and push
git add .
git commit -m "Feature: your feature"
git push
```

---

## 💭 **Command Tips**

### **Chaining Commands**
```cmd
REM Run multiple commands (stop on error)
command1 && command2 && command3

REM Run multiple commands (continue on error)
command1 & command2 & command3
```

### **Piping Output**
```cmd
REM Send output to another command
dir | findstr .tsx

REM Save output to file
dir > files.txt

REM Append to file
dir >> files.txt
```

### **Redirecting**
```cmd
REM Redirect error to null (hide errors)
command 2>nul

REM Redirect both output and error
command >output.txt 2>&1
```

---

## 🎆 **Quick Fixes**

```cmd
REM Fix permission errors (most common)
taskkill /IM node.exe /F /Q
rmdir /s /q node_modules\.prisma
npm run prisma:generate
set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

REM Fix port already in use
netstat -ano | findstr :3000
REM Get PID and:
taskkill /PID XXXX /F

REM Fix out of memory
set NODE_OPTIONS=--max-old-space-size=8192 && npm run build

REM Fix npm install issues
npm cache clean --force
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

## 🔖 **Your Batch Scripts**

```cmd
REM Run auto fix script
fix-and-build.bat

REM Or manually:
REM Create fix-and-build.bat in project root
REM Double-click to run
REM It will:
 REM - Kill Node
 REM - Clear cache
 REM - Build
 REM - Start server
```

---

## 📚 **Documentation Files**

| File | Purpose |
|------|----------|
| **QUICK_FIX.md** | 30-second fixes |
| **WINDOWS_PRISMA_FIX.md** | Prisma error solutions |
| **WINDOWS_BUILD_GUIDE.md** | Command reference |
| **NEXTAUTH_V5_REACT19_FIX.md** | Auth system details |
| **WINDOWS_SETUP_COMPLETE.md** | Complete setup guide |
| **COMMAND_CHEATSHEET.md** | This file |

---

## ✅ **Success Commands**

```cmd
REM Build succeeds when you see:
✓ Compiled successfully
✓ Build Complete

REM Dev server ready when you see:
✓ Ready in 2.5s
✓ Local: http://localhost:3000

REM Test app by visiting:
http://localhost:3000
```

---

**Print this file for quick reference!** 📗👋
