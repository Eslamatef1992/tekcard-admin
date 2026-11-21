#!/usr/bin/env bash
# Run on the server after pushing to GitHub:  cd /var/www/tekcard-admin && ./deploy.sh
set -e
cd "$(dirname "$0")"

NODE_DIR=/opt/node22
if [ ! -x "$NODE_DIR/bin/node" ]; then
  echo "Node 22 not found in $NODE_DIR — see the tekcard-api README to install it"; exit 1
fi
export PATH="$NODE_DIR/bin:$PATH"   # build with Node 22 (Vite needs >= 20.19)

git pull --ff-only
[ -f .env ] || cp .env.example .env
npm ci
npm run build
echo "Admin built -> $(pwd)/dist (served by Nginx at https://admin.teknulugycard.com)"
