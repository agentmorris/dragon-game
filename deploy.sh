#!/bin/bash

# Dragon Strike Deployment Script for Ubuntu
# Run this script on your Ubuntu server to deploy the game

set -e

echo "🐉 Dragon Strike Deployment Script"
echo "=================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js already installed"
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 already installed"
fi

# Create deployment directory
DEPLOY_DIR="/opt/dragonstrike"
echo "📁 Setting up deployment directory at ${DEPLOY_DIR}"

if [ ! -d "$DEPLOY_DIR" ]; then
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown $USER:$USER "$DEPLOY_DIR"
fi

# Copy files (assuming script is run from project directory)
echo "📋 Copying project files..."
cp -r * "$DEPLOY_DIR/"
cd "$DEPLOY_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up PM2
echo "🚀 Setting up PM2 process..."
pm2 delete dragonstrike 2>/dev/null || true
pm2 start server/server.js --name "dragonstrike"

# Set up PM2 to start on boot
echo "⚙️ Configuring PM2 startup..."
pm2 startup | grep "sudo" | bash || true
pm2 save

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Display status
echo ""
echo "🎉 Deployment complete!"
echo "=================================="
echo "Game server is running on port 3000"
echo "🌐 Access at: http://$(curl -s ifconfig.me):3000/room/battle1"
echo ""
echo "📊 Server status:"
pm2 status

echo ""
echo "🔧 Useful commands:"
echo "  pm2 status           - Check server status"
echo "  pm2 logs dragonstrike - View server logs"
echo "  pm2 restart dragonstrike - Restart server"
echo "  pm2 stop dragonstrike - Stop server"