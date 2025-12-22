# 🪟 PitchConnect - Windows Build Guide
## Complete Setup & Build Instructions for Windows Command Prompt

---

## ⚡ Quick Start (Windows CMD)

### **Step 1: Clear Build Cache**

```cmd
# Windows Command Prompt (NOT PowerShell)
rmdir /s /q .next
rmdir /s /q node_modules\.cache
```

### **Step 2: Reinstall Dependencies (Optional)**

```cmd
npm install
```

### **Step 3: Build with Memory Allocation**

```cmd
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

### **Step 4: Run Development Server**

```cmd
npm run dev
```

### **Step 5: Open in Browser**

```cmd
start http://localhost:3000
```

---

## 📋 Command Comparison: Windows vs Unix

| Task | Unix/Mac/Linux | Windows CMD | Windows PowerShell |
|------|---|---|---|
| **Delete folder** | `rm -rf .next` | `rmdir /s /q .next` | `Remove-Item -Recurse .next` |
| **List files** | `ls` | `dir` | `Get-ChildItem` |
| **Set env var** | `export VAR=value` | `set VAR=value` | `$env:VAR='value'` |
| **View file** | `cat file.txt` | `type file.txt` | `Get-Content file.txt` |
| **Change dir** | `cd folder` | `cd folder` | `cd folder` |
| **Clear screen** | `clear` | `cls` | `Clear-Host` |

---

## 🎯 Full Build Workflow (Windows)

### **Complete Clean Build**

```cmd
C:\Users\Hazye\PitchConnect V1> cls

C:\Users\Hazye\PitchConnect V1> echo === Cleaning Build Cache ===

C:\Users\Hazye\PitchConnect V1> rmdir /s /q .next

C:\Users\Hazye\PitchConnect V1> echo === Installing Dependencies ===

C:\Users\Hazye\PitchConnect V1> npm install

C:\Users\Hazye\PitchConnect V1> echo === Building Next.js Application ===

C:\Users\Hazye\PitchConnect V1> set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

C:\Users\Hazye\PitchConnect V1> echo === Build Complete ===

C:\Users\Hazye\PitchConnect V1> echo === Starting Development Server ===

C:\Users\Hazye\PitchConnect V1> npm run dev
```

---

## 🔧 Windows Command Reference

### **Directory Operations**

```cmd
# List files in current directory
dir

# List files with details
dir /s

# Change directory
cd your-folder

# Go to parent directory
cd ..

# Go to root of drive
cd \

# Print current directory
cd

# Create new folder
mkdir new-folder

# Delete empty folder
rmdir folder-name

# Delete folder with contents
rmdir /s /q folder-name

# Delete file
del filename.txt

# Delete multiple files
del *.log
```

### **File Operations**

```cmd
# View file contents
type filename.txt

# Copy file
copy source.txt destination.txt

# Copy folder
copy /Y /S source\ destination\

# Rename file
ren oldname.txt newname.txt

# Search in files
findstr "search-text" filename.txt

# Count files
dir /b | find /c /v ""
```

### **Environment & System**

```cmd
# Set environment variable
set VARIABLE_NAME=value

# Set variable and run command
set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

# View environment variable
echo %VARIABLE_NAME%

# View all environment variables
set

# Clear screen
cls

# Print text
echo Hello World

# Pause execution
pause

# Execute batch file
batch-file.bat
```

### **Process Management**

```cmd
# View running processes
tasklist

# Kill process by name
taskkill /IM node.exe /F

# Kill process by ID
taskkill /PID 1234 /F

# Find port usage
netstat -ano | findstr :3000

# Kill process on specific port
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /PID %a /F
```

### **NPM Commands**

```cmd
# Install dependencies
npm install

# Install single package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Remove package
npm uninstall package-name

# List installed packages
npm list

# Update packages
npm update

# Clean npm cache
npm cache clean --force

# Check npm version
npm --version

# Check Node version
node --version
```

---

## 🚀 Development Server Commands

```cmd
# Start development server
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Run TypeScript type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm test

# Generate Prisma client
npm run prisma:generate

# Run Prisma migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

---

## 📍 Navigation Tips

### **Understanding Your Path**

```cmd
# You are here:
C:\Users\Hazye\PitchConnect V1>

# Breaking it down:
C:\                    = Root of C: drive
Users\                 = Users folder
Hazye\                 = Your user folder
PitchConnect V1\       = Project folder
```

### **Quick Navigation**

```cmd
# Go directly to PitchConnect project
cd C:\Users\Hazye\PitchConnect V1

# Or if you're already in a subdirectory:
cd ..
cd ..
cd "PitchConnect V1"

# Create shortcut in Command Prompt
cd /d C:\Users\Hazye\PitchConnect V1
```

---

## ⚙️ System Information

### **Check Your System**

```cmd
# Node version
node --version

# NPM version
npm --version

# OS version
ver

# Available disk space
diskpart
list disk
exit

# System information
systeminfo

# Check if port 3000 is available
netstat -ano | findstr :3000
```

---

## 🐛 Troubleshooting

### **Issue: "Command not found"

```cmd
# Solution: Add to PATH or use full path
C:\Program Files\nodejs\node.exe --version

# Or reinstall Node.js from https://nodejs.org
```

### **Issue: Permission Denied

```cmd
# Solution: Run Command Prompt as Administrator
# Right-click Command Prompt → Run as administrator
```

### **Issue: Port 3000 Already in Use

```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the number shown)
taskkill /PID 1234 /F

# Or use different port
set PORT=3001
npm run dev
```

### **Issue: Out of Memory

```cmd
# Increase Node.js memory allocation
set NODE_OPTIONS=--max-old-space-size=4096
npm run build

# Or even more for very large projects
set NODE_OPTIONS=--max-old-space-size=8192
```

### **Issue: npm modules won't install

```cmd
# Clear npm cache
npm cache clean --force

# Delete node_modules
rmdir /s /q node_modules

# Delete package-lock.json
del package-lock.json

# Reinstall
npm install
```

---

## 📝 Useful Batch Scripts

### **Quick Build Script (save as `build.bat`)**

```batch
@echo off
REM Quick build script for Windows

echo === Cleaning Build Cache ===
rmdir /s /q .next

echo === Building Application ===
set NODE_OPTIONS=--max-old-space-size=4096
npm run build

if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo === Build Complete ===
pause
```

### **Start Dev Server (save as `dev.bat`)**

```batch
@echo off
REM Start development server

echo Starting development server on http://localhost:3000
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev

pause
```

### **Clean Cache (save as `clean.bat`)**

```batch
@echo off
REM Clean all build and node caches

echo Cleaning .next folder...
rmdir /s /q .next

echo Cleaning node_modules cache...
rmdir /s /q node_modules\.cache

echo Cache cleared!
pause
```

---

## ✅ Verification Checklist

After building, verify everything is working:

```cmd
REM Check files exist
dir .next
dir node_modules
dir src

REM Check build output
type .next\BUILD_ID

REM Verify Node modules
dir node_modules | findstr next-auth
dir node_modules | findstr prisma

REM Test development server
npm run dev
REM Then open http://localhost:3000 in browser
```

---

## 🎓 Windows Command Tips

### **Useful Shortcuts**

```cmd
# Up arrow = previous command
# Down arrow = next command
# Tab = auto-complete filename
# Ctrl+C = stop running command
# Ctrl+Z = undo (in some editors)
# F7 = show command history
```

### **Command Chaining**

```cmd
# Run commands sequentially (stop on error)
command1 && command2 && command3

# Run commands sequentially (continue on error)
command1 & command2 & command3

# Pipe output
dir | findstr .txt

# Redirect to file
dir > output.txt

# Append to file
dir >> output.txt
```

---

## 📊 Expected Build Output

When you run the build, you should see:

```
C:\Users\Hazye\PitchConnect V1> set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

> pitchconnect@1.0.0 build
> npm run prisma:generate && next build

> pitchconnect@1.0.0 prisma:generate
> prisma generate

✔ Generated Prisma Client (v5.22.0) in XXXms

▲ Next.js 15.5.9
  - Environments: .env.local, .env

  Creating an optimized production build ...
✓ Compiled successfully in ~15s
  Skipping linting
  Checking validity of types ...
✓ Type validation passed

✓ Build Complete
```

---

## 🎯 Your Specific Setup

**Your Path:** `C:\Users\Hazye\PitchConnect V1`

### **Step-by-Step for Your System**

```cmd
Step 1: Open Command Prompt
Press: Windows Key + R
Type: cmd
Press: Enter

Step 2: Navigate to project
C:\Users\Hazye> cd "PitchConnect V1"

Step 3: Clear cache
C:\Users\Hazye\PitchConnect V1> rmdir /s /q .next

Step 4: Build
C:\Users\Hazye\PitchConnect V1> set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

Step 5: Run dev server
C:\Users\Hazye\PitchConnect V1> npm run dev

Step 6: Open browser
http://localhost:3000
```

---

## 📞 Need Help?

If commands don't work:

1. **Make sure you're in the right directory:**
   ```cmd
   cd /d C:\Users\Hazye\PitchConnect V1
   ```

2. **Check Node is installed:**
   ```cmd
   node --version
   npm --version
   ```

3. **Run as Administrator if permission issues:**
   - Right-click Command Prompt
   - Select "Run as administrator"

4. **Use forward slashes in paths:**
   ```cmd
   set NODE_OPTIONS=--max-old-space-size=4096
   ```

---

## ✨ Summary

**Key Windows Commands:**
- `rmdir /s /q .next` = Delete .next folder
- `set VAR=value` = Set environment variable
- `set NODE_OPTIONS=--max-old-space-size=4096` = Allocate 4GB memory
- `npm run build` = Build Next.js app
- `npm run dev` = Start development server
- `cls` = Clear screen

**You're ready to build PitchConnect on Windows!** 🚀⚽
