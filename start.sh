#!/bin/bash
# start.sh — Szybki start projektu dla nowego developera

echo "🚀 FIFA Card Manager — Setup"
echo "============================"

# Backend
echo ""
echo "📦 Instalacja zależności backendu..."
cd backend
npm install

# Skopiuj .env jeśli nie istnieje
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Skopiowano .env.example → .env (uzupełnij JWT_SECRET!)"
fi

# Seed bazy danych
echo ""
echo "🗃️  Inicjalizacja bazy danych z danymi startowymi..."
npm run seed

echo ""
echo "✅ Backend gotowy!"

# Frontend
echo ""
echo "📦 Instalacja zależności frontendu..."
cd ../frontend
npm install

echo ""
echo "✅ Frontend gotowy!"

echo ""
echo "========================================"
echo "🎮 Uruchomienie:"
echo "  Terminal 1:  cd backend && npm run dev"
echo "  Terminal 2:  cd frontend && npm run dev"
echo ""
echo "🔗 Adresy:"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3001"
echo "  API Docs:  docs/api.md"
echo ""
echo "👤 Konta testowe:"
echo "  Admin:  admin@fifa.pl / admin123"
echo "  Gracz:  player@fifa.pl / player123"
echo "========================================"
