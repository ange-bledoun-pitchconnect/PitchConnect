# 🚨 Quick Fix Guide - JWT_SESSION_ERROR

**Problem**: You're getting `JWT_SESSION_ERROR: decryption operation failed`

**Root Cause**: `NEXTAUTH_SECRET` is missing or incorrect in your `.env.local`

---

## 🔧 IMMEDIATE FIX (5 minutes)

### Step 1: Generate a Secret

**On Windows (Command Prompt):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

This will output something like:
```
AbCd1234AbCd1234AbCd1234AbCd1234AbCd12=
```

**Copy this value** (you'll need it in the next step)

---

### Step 2: Update `.env.local`

**File Location**: `C:\Users\Hazye\PitchConnect V1\.env.local`

**Add or Update These Lines:**
```env
# CRITICAL - Must be set!
NEXTAUTH_SECRET=paste_your_generated_secret_here

# Must match your app URL
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_URL=your_database_url
```

**Example .env.local:**
```env
NEXTAUTH_SECRET=aBcDeF1234ghIjKl5678mnOpQrSt9012uvWxYz/Abc=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrst
DATABASE_URL=postgresql://user:password@localhost:5432/pitchconnect
```

---

### Step 3: Stop & Restart Dev Server

**In your Command Prompt (where you ran `npm run dev`):**
1. Press `Ctrl + C` to stop the server
2. Wait 2 seconds
3. Run again:
   ```bash
   npm run dev
   ```

---

### Step 4: Verify the Fix

**Expected Output:**
```
✓ Ready in 3.1s
○ Compiling / ...
✓ Compiled / in 7.7s
GET / 200 in 2345ms
```

**NO MORE JWT_SESSION_ERROR ✅**

---

## 🔍 Verify Environment Variables Are Being Read

### Option A: Check in Node

```bash
node -e "require('dotenv').config(); console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ SET' : '❌ NOT SET'); console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ NOT SET');"
```

### Option B: Check .env.local Exists

**Windows Command Prompt:**
```bash
dir .env.local
```

**Expected:**
```
12/22/2025  11:00 PM               452 .env.local
```

If you see "File not found", you need to create `.env.local`

---

## 📋 Checklist

- [ ] Generated NEXTAUTH_SECRET using Node or OpenSSL
- [ ] Created/Updated `.env.local` file
- [ ] Added `NEXTAUTH_SECRET` to `.env.local`
- [ ] Added `NEXTAUTH_URL=http://localhost:3000` to `.env.local`
- [ ] Added Google OAuth credentials to `.env.local`
- [ ] Stopped dev server (Ctrl+C)
- [ ] Restarted dev server (`npm run dev`)
- [ ] No JWT_SESSION_ERROR in console ✅
- [ ] Page loads at `http://localhost:3000` ✅

---

## ❌ If it Still Doesn't Work

### Issue 1: .env.local not being read

**Check that file is in the RIGHT location:**
```
C:\Users\Hazye\PitchConnect V1\.env.local  ✅ CORRECT
C:\Users\Hazye\PitchConnect V1\src\.env.local  ❌ WRONG
```

### Issue 2: npm cache issue

```bash
# Clear Next.js cache
rm -r .next
# or on Windows:
rmdir /s /q .next

# Restart dev server
npm run dev
```

### Issue 3: Dependencies need reinstall

```bash
# Clear everything and reinstall
rm -r node_modules package-lock.json
# or on Windows:
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install

# Generate Prisma
npm run prisma:generate

# Run dev
npm run dev
```

---

## 🌐 Getting Google OAuth Credentials

### Step-by-Step Google Setup

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project:**
   - Click "Select a Project" → "New Project"
   - Name: "PitchConnect"
   - Click "Create"

3. **Enable Google+ API:**
   - Search for "Google+ API"
   - Click it and select "Enable"

4. **Create OAuth Credentials:**
   - Go to "Credentials" (left sidebar)
   - Click "Create Credentials" → "OAuth Client ID"
   - Choose "Web application"
   - Under "Authorized redirect URIs" add:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click "Create"

5. **Copy Your Credentials:**
   - You'll see "Client ID" and "Client secret"
   - Copy both to your `.env.local`:
     ```env
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```

---

## ✅ Success Indicators

✅ Dev server starts without JWT_SESSION_ERROR
✅ Page loads at http://localhost:3000
✅ Hero section displays correctly
✅ "Get Started" button is clickable
✅ Google OAuth popup appears when clicking button
✅ Successfully redirect to /dashboard after sign-in

---

## 🆘 Need Help?

If still stuck:
1. Check `.env.local` has at least 3 lines:
   - NEXTAUTH_SECRET (min 32 chars)
   - NEXTAUTH_URL=http://localhost:3000
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET

2. Verify file encoding is UTF-8 (not UTF-8 BOM)
   - Open in VS Code → check bottom right

3. No spaces or quotes around values:
   ```
   ✅ NEXTAUTH_SECRET=abc123xyz789
   ❌ NEXTAUTH_SECRET="abc123xyz789"
   ❌ NEXTAUTH_SECRET = abc123xyz789
   ```

---

**You should be up and running in 5 minutes! 🚀**
