#!/bin/bash

# Velaa Backend Production Startup Script
# This script sets up and starts the Velaa backend in production mode

echo "🚀 Starting Velaa Backend in Production Mode..."

# Set production environment
export NODE_ENV=production

# Load production environment variables
if [ -f "env.production" ]; then
    echo "📋 Loading production environment variables..."
    export $(cat env.production | grep -v '^#' | xargs)
fi

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

# Start the application
echo "🎯 Starting Velaa Backend Server..."
echo "📍 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"
echo "🌍 API Base URL: http://localhost:$PORT/api"
echo ""

# Start the server
node server.js
