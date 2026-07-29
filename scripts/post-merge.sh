#!/bin/bash
set -e

# Install root deps (workspaces cover frontend/backend if configured)
npm install --no-audit --no-fund

# Install per-package deps if they have their own package.json lockfiles
if [ -f frontend/package.json ]; then (cd frontend && npm install --no-audit --no-fund); fi
if [ -f backend/package.json ]; then (cd backend && npm install --no-audit --no-fund); fi
