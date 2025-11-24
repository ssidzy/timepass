# 🚀 Complete Setup Guide

## Prerequisites

Before you can run the streaming app, you need:

1. **Node.js** (v14 or higher)
2. **npm** (comes with Node.js)
3. **FFmpeg** (for video encoding)

## Step 1: Install Node.js

### Windows
1. Go to https://nodejs.org/
2. Download "LTS" (Long Term Support) version
3. Run the installer
4. Follow the installation wizard (accept all defaults)
5. Restart your computer

### Verify Installation
Open PowerShell or Command Prompt and run:
```bash
node --version
npm --version
```

You should see version numbers like:
```
v18.17.0
9.6.7
```

## Step 2: Navigate to Project

Open PowerShell or Command Prompt:
```bash
cd "c:\Users\sande\Documents\Underground\streaming-app"
```

Verify you're in the right folder:
```bash
dir
```

You should see files like `package.json`, `README.md`, `backend/`, `frontend/`, etc.

## Step 3: Install Dependencies

Run this command:
```bash
npm install
```

This will:
- Download all required Node.js packages
- Create a `node_modules` folder (~300 MB)
- Take 2-5 minutes depending on your internet speed

You'll see output like:
```
added 150 packages in 2m
```

## Step 4: Install FFmpeg

FFmpeg is required for video encoding. 

### Windows (Easiest Method - Using Chocolatey)

If you have Chocolatey installed:
```bash
choco install ffmpeg
```

### Windows (Manual Download)

1. Go to https://ffmpeg.org/download.html
2. Click "Windows builds from gyan.dev"
3. Download "full" version (not "shared")
4. Extract to a folder (e.g., `C:\ffmpeg\`)
5. Add to PATH:
   - Right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", click "Path"
   - Click "Edit"
   - Click "New"
   - Add your FFmpeg folder path (e.g., `C:\ffmpeg\bin`)
   - Click OK

### Verify FFmpeg Installation

```bash
ffmpeg -version
```

Should show FFmpeg version and information.

## Step 5: Configure Environment (Optional)

The app works with default settings. To customize:

```bash
copy .env.example .env
```

Edit `.env` with these options:
```
PORT=3000                    # Server port
DEFAULT_QUALITY=1080p60     # Default quality
MAX_QUALITY=4k60            # Max quality
MAX_PARTICIPANTS=50         # Max participants
```

## Step 6: Start the Server

```bash
npm start
```

You should see:
```
Streaming server running on port 3000
```

## Step 7: Open in Browser

Open your web browser and go to:
```
http://localhost:3000
```

You should see the StreamVerse interface!

---

## Troubleshooting

### "npm is not recognized"
**Solution:** Node.js not installed or not in PATH
- Reinstall Node.js from https://nodejs.org/
- Restart your computer after installation

### "ffmpeg is not recognized"
**Solution:** FFmpeg not installed or not in PATH
- Install FFmpeg (see Step 4 above)
- Restart your computer after installation

### "Port 3000 is already in use"
**Solution:** Another app is using port 3000
- Option 1: Stop the other app
- Option 2: Change PORT in .env file to 3001, 3002, etc.

### "Cannot find module 'express'"
**Solution:** Dependencies not installed
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

### Server starts but no video shows
**Solution:** Browser permissions needed
- Click camera/microphone icon in browser address bar
- Allow access to camera and microphone
- Refresh the page

### "EACCES: permission denied"
**Solution:** Node process needs permission
- On Linux/Mac: Use `sudo npm start`
- Or change file permissions: `chmod -R 755 node_modules`

---

## Quick Start Summary

```bash
# 1. Navigate to project
cd "c:\Users\sande\Documents\Underground\streaming-app"

# 2. Install dependencies (first time only)
npm install

# 3. Start server
npm start

# 4. Open browser
# http://localhost:3000
```

---

## What Happens When You Run

1. **npm start** starts the Express server
2. Server listens on http://localhost:3000
3. Open the URL in your browser
4. You see the StreamVerse interface
5. **To stream:** Click "Start Stream"
6. **To join:** Enter Stream ID and name, click "Join Stream"

---

## System Requirements

**Minimum:**
- Intel Core i5 / AMD Ryzen 5 (or equivalent)
- 8 GB RAM
- 2 Mbps internet connection
- Modern browser (Chrome, Firefox, Safari, Edge)

**Recommended:**
- Intel Core i7 / AMD Ryzen 7 (or equivalent)
- 16 GB RAM
- 10+ Mbps internet connection
- Windows 10/11, macOS, or Linux

---

## Next Steps

After setup is complete:

1. Read **README.md** for feature overview
2. Try streaming a video
3. Test joining as participant
4. Check network stats panel
5. Explore quality settings

---

## Getting Help

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Read **README.md** → Troubleshooting section
3. Check browser console (F12 → Console tab)
4. Check npm start output for error messages

---

**You're all set! Happy streaming! 🚀**
