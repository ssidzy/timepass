#!/bin/bash
# Quick Start Setup Script for Streaming App

echo "🎬 StreamVerse - Quick Setup"
echo "=============================="

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js v14+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check FFmpeg installation
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg not found. Installing FFmpeg..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y ffmpeg
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v brew &> /dev/null; then
            echo "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install ffmpeg
    else
        echo "❌ Please install FFmpeg manually from https://ffmpeg.org/download.html"
        exit 1
    fi
fi

echo "✅ FFmpeg version: $(ffmpeg -version | head -n1)"

# Create .env file if doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
fi

# Install npm dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p streams
mkdir -p logs
mkdir -p temp

echo ""
echo "=============================="
echo "✅ Setup complete!"
echo ""
echo "To start the server, run:"
echo "  npm start"
echo ""
echo "Server will run on: http://localhost:3000"
echo "=============================="
