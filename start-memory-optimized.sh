#!/bin/bash

# Velaa Backend Memory-Optimized Startup Script
# This script starts the Velaa backend with memory optimizations

echo "🚀 Starting Velaa Backend with Memory Optimizations..."

# Set production environment
export NODE_ENV=production

# Load memory-optimized environment variables
if [ -f "env.memory-optimized" ]; then
    echo "📋 Loading memory-optimized environment variables..."
    export $(cat env.memory-optimized | grep -v '^#' | xargs)
fi

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=64"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads/clients/documents
mkdir -p uploads/general
mkdir -p uploads/profiles
mkdir -p uploads/vehicles/documents
mkdir -p uploads/vehicles/images
mkdir -p backups

# Set proper permissions
echo "🔐 Setting file permissions..."
chmod 755 logs
chmod 755 uploads
chmod 755 uploads/clients
chmod 755 uploads/clients/documents
chmod 755 uploads/general
chmod 755 uploads/profiles
chmod 755 uploads/vehicles
chmod 755 uploads/vehicles/documents
chmod 755 uploads/vehicles/images
chmod 755 backups

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Start the application with memory optimizations
echo "🎯 Starting Velaa Backend Server with Memory Optimizations..."
echo "📍 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"
echo "💾 Memory Limit: 1GB"
echo "🌍 API Base URL: http://localhost:$PORT/api"
echo ""

# Start the server with memory optimizations
node --max-old-space-size=1024 --max-semi-space-size=64 server-optimized.js
