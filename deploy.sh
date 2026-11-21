#!/usr/bin/env bash
# Run on the server after pushing to GitHub:  cd /var/www/tekcard-admin && ./deploy.sh
set -e
cd "$(dirname "$0")"
git pull --ff-only
[ -f .env ] || cp .env.example .env
npm ci
npm run build
echo "Admin built -> $(pwd)/dist (served by Nginx at https://admin.teknulugycard.com)"
