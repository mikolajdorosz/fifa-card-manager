# FIFA Card Manager — AGH WWW and Script Languages Project

A full-stack football card management application inspired by FIFA Ultimate Team. It is an academic project combining a Vue.js frontend with a Node.js/Express backend and integrates external football data through TheSportsDB API.

## Project overview

The application provides two main user interfaces: player panel, that allows player managing a squad, collecting cards and printing their pdf versions, opening packs, using the transfer market and completing Squad Building Challenges, and admin panel, that is responsible for creating cards either from API or custom data, card templates, packs and SBCs.

Player data is retrieved from an external football API and used to generate collectible cards. Users can also export individual cards as PDF files.

## Project structure

```
fifa-manager/
├── backend/                  # Node.js + Express + SQLite/Sequelize
│   ├── config/                # Database configuration and seed of sample data
│   ├── controllers/           # Business logic for each module
│   ├── middleware/            # Auth (JWT), file upload (Multer)
│   ├── models/                # Modele Sequelize (SQLite tables)
│   ├── routes/                # API endpoint definitions
│   ├── services/               # Services (TheSportsDB API, drawing cards from packs)
│   └── uploads/                # Pictures send by admin (custom cards, template backgrounds)
├── frontend/                  # Vue 3 + TailwindCSS (Vite)
│   └── src/
│       ├── api/                # Axios instance configuration
│       ├── components/cards/   # PlayerCard.vue — card render + PDF export
│       ├── router/             # Vue Router + authorization guard
│       ├── store/              # Pinia (state of logged user)
│       └── views/
│           ├── admin/          # Admin panel: cards, templates, packs, SBC
│           └── player/         # Player panel: squad, collection, SBC, market, shop
└── docs/                       # API documentation
```

## Running the project

### Setup

```bash
./start.sh
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## TheSportsDB API

Base URL: `https://www.thesportsdb.com/api/v1/json/3/`

Key endpoints used in app — `docs/api.md`
