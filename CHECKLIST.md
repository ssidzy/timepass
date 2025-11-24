# ✅ SETUP CHECKLIST

## Pre-Installation Checklist

- [ ] Internet connection available
- [ ] Administrator access to your computer
- [ ] At least 1 GB free disk space
- [ ] Web browser installed (Chrome, Firefox, Safari, or Edge)

---

## Installation Checklist

### Step 1: Install Node.js
- [ ] Go to https://nodejs.org/
- [ ] Download LTS version
- [ ] Run installer
- [ ] Accept all defaults
- [ ] **RESTART YOUR COMPUTER**
- [ ] Verify: Open Command Prompt and run `node --version`
- [ ] Verify: Run `npm --version`

### Step 2: Install FFmpeg
- [ ] Go to https://ffmpeg.org/download.html
- [ ] Download full version for Windows
- [ ] Extract to folder (e.g., C:\ffmpeg\)
- [ ] Add to Windows PATH (optional, but recommended)
- [ ] Verify: Open Command Prompt and run `ffmpeg -version`

### Step 3: Install Application Dependencies
- [ ] Open Command Prompt/PowerShell
- [ ] Navigate: `cd "c:\Users\sande\Documents\Underground\streaming-app"`
- [ ] Run: `npm install`
- [ ] Wait for completion (~2-5 minutes)
- [ ] No errors shown

### Step 4: (Optional) Configure Environment
- [ ] Copy: `copy .env.example .env`
- [ ] Edit: `.env` file with custom settings
- [ ] Save changes

---

## Running the Application

### First Time Setup
- [ ] All installation steps complete
- [ ] No error messages
- [ ] Ready to start server

### Start Server
- [ ] Open Command Prompt/PowerShell
- [ ] Navigate: `cd "c:\Users\sande\Documents\Underground\streaming-app"`
- [ ] Run: `npm start`
- [ ] See message: "Streaming server running on port 3000"

### Access Application
- [ ] Open web browser (Chrome recommended)
- [ ] Go to: `http://localhost:3000`
- [ ] See StreamVerse interface load
- [ ] Allow camera/microphone permissions when prompted

---

## Testing the Application

### Host a Stream
- [ ] Click "Start Stream" button
- [ ] Enter stream title (e.g., "Test Stream")
- [ ] Select quality (1080p60 recommended)
- [ ] See "Stream ID" displayed
- [ ] Video shows in main display
- [ ] Network stats show (bandwidth, ping, etc.)

### Join as Participant
- [ ] Open another browser tab or computer
- [ ] Go to: `http://localhost:3000`
- [ ] Enter the Stream ID from host
- [ ] Enter your name
- [ ] Click "Join Stream"
- [ ] See participant count increase
- [ ] See participant video in grid

### Test Features
- [ ] Toggle video (on/off)
- [ ] Toggle audio (on/off)
- [ ] Send chat message
- [ ] Change quality level
- [ ] Monitor network stats
- [ ] Share screen (if supported)

---

## Troubleshooting Checklist

If you encounter errors:

### "Node is not installed"
- [ ] Download from https://nodejs.org/
- [ ] Run installer
- [ ] Restart computer
- [ ] Verify with `node --version`

### "FFmpeg not found"
- [ ] Download from https://ffmpeg.org/
- [ ] Extract to folder
- [ ] Add to Windows PATH
- [ ] Restart and verify with `ffmpeg -version`

### "npm install fails"
- [ ] Check internet connection
- [ ] Try again: `npm install`
- [ ] If still fails, delete `node_modules` folder
- [ ] Delete `package-lock.json` file
- [ ] Run `npm install` again

### "Port 3000 already in use"
- [ ] Stop other apps using port 3000
- [ ] Or edit `.env` and change PORT to 3001
- [ ] Run `npm start` again

### "No video showing"
- [ ] Allow camera/microphone in browser
- [ ] Check browser console (F12) for errors
- [ ] Refresh page (Ctrl+R)
- [ ] Try different browser

### "Can't connect to server"
- [ ] Make sure `npm start` is running
- [ ] Check if server shows "Streaming server running"
- [ ] Try: `http://localhost:3000` (not https)
- [ ] Check firewall isn't blocking port 3000

---

## Verification Checklist

### Everything Working?
- [ ] Node.js installed and working
- [ ] FFmpeg installed and working
- [ ] Dependencies installed (npm install completed)
- [ ] Server starts without errors (`npm start`)
- [ ] Browser can reach http://localhost:3000
- [ ] UI loads and shows controls
- [ ] Camera/microphone permissions working
- [ ] Can start stream
- [ ] Can join stream
- [ ] Network stats showing

---

## Documentation Checklist

- [ ] Read **START_HERE.md** (this was sent)
- [ ] Read **SETUP_GUIDE.md** for detailed steps
- [ ] Read **README.md** for features
- [ ] Read **QUICK_START.js** for code examples
- [ ] Bookmark **STRUCTURE.md** for reference

---

## Next Steps Checklist

- [ ] Test streaming with different qualities
- [ ] Monitor network stats
- [ ] Test real-time features
- [ ] Read advanced documentation
- [ ] Plan production deployment

---

## Support Resources

**If you get stuck:**
1. Check **SETUP_GUIDE.md** troubleshooting section
2. Check **README.md** troubleshooting section
3. Check browser console: F12 → Console tab
4. Check npm start output for error messages

---

## Quick Command Reference

```bash
# Install Node.js
# Go to https://nodejs.org/ and download LTS

# Check Node.js installation
node --version
npm --version

# Install FFmpeg
# Go to https://ffmpeg.org/ and download

# Navigate to project
cd "c:\Users\sande\Documents\Underground\streaming-app"

# Install dependencies
npm install

# Start server
npm start

# In browser
http://localhost:3000
```

---

**Status:** ✅ All code written, ready to run!  
**Action Required:** Install Node.js + FFmpeg  
**Time to Setup:** ~30-45 minutes  
**Time to First Stream:** ~5 minutes after setup

---

**You've got this! Follow the checklist and you'll be streaming in no time.** 🚀
