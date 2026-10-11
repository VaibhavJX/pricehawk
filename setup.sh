#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  PriceHawk — One-command local dev setup
#  Usage: bash setup.sh
# ─────────────────────────────────────────────────────────────
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  🦅 PriceHawk — Setup"
echo "─────────────────────────────────────────"
echo -e "${NC}"

# ── Step 1: Python virtualenv + backend deps ──────────────────
echo -e "${GREEN}[1/5] Setting up Python backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo -e "${YELLOW}[1/5] Installing Playwright Chromium browser...${NC}"
playwright install chromium

# ── Step 2: Copy .env ─────────────────────────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${YELLOW}[2/5] Created backend/.env — please fill in your API keys!${NC}"
else
  echo -e "${GREEN}[2/5] backend/.env already exists — skipping.${NC}"
fi

cd ..

# ── Step 3: Frontend deps ─────────────────────────────────────
echo -e "${GREEN}[3/5] Installing frontend dependencies...${NC}"
cd frontend
npm install --silent
cd ..

# ── Step 4: Check MongoDB ─────────────────────────────────────
echo -e "${GREEN}[4/5] Checking MongoDB...${NC}"
if command -v mongod &>/dev/null; then
  if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}MongoDB is installed but not running. Starting...${NC}"
    mongod --fork --logpath /tmp/mongod.log --dbpath /usr/local/var/mongodb 2>/dev/null || \
      brew services start mongodb-community 2>/dev/null || \
      echo -e "${YELLOW}Please start MongoDB manually: brew services start mongodb-community${NC}"
  else
    echo "MongoDB is already running ✅"
  fi
else
  echo -e "${YELLOW}MongoDB not found locally. Install it with:${NC}"
  echo "  brew tap mongodb/brew && brew install mongodb-community"
  echo -e "${YELLOW}Or use the free MongoDB Atlas cloud: https://www.mongodb.com/atlas${NC}"
fi

# ── Step 5: Instructions ──────────────────────────────────────
echo ""
echo -e "${BLUE}─────────────────────────────────────────${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "Start the backend:"
echo -e "  ${YELLOW}cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000${NC}"
echo ""
echo -e "Start the frontend (in a new terminal):"
echo -e "  ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo -e "Then open: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "📝 Don't forget to fill in ${YELLOW}backend/.env${NC} with your:"
echo "   • SendGrid API key (email notifications)"
echo "   • Telegram Bot token"
echo "   • A strong SECRET_KEY"
echo -e "${BLUE}─────────────────────────────────────────${NC}"
