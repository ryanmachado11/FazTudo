#!/bin/sh
set -eu

echo "Waiting for MySQL to be ready..."
until node -e "const net=require('net'); const client=net.createConnection({host:'mysql',port:3306}); client.on('connect',()=>process.exit(0)); client.on('error',()=>process.exit(1));"; do
  echo "MySQL not ready yet, retrying..."
  sleep 2
done

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run seed

echo "Starting FazTudo API..."
exec npm run start
