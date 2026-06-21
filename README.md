# ⚽ FIFA Card Manager — AGH WWW Project

Menedżer piłkarski z systemem kart inspirowany grą FIFA, oparty na TheSportsDB API.

## 🏗️ Struktura projektu

```
fifa-manager/
├── backend/                  # Node.js + Express + SQLite/Sequelize
│   ├── config/                # Konfiguracja bazy danych i seed danych testowych
│   ├── controllers/           # Logika biznesowa dla każdego modułu
│   ├── middleware/            # Auth (JWT), upload plików (Multer)
│   ├── models/                # Modele Sequelize (tabele SQLite)
│   ├── routes/                # Definicje endpointów API
│   ├── services/               # Serwisy (TheSportsDB API, losowanie paczek)
│   └── uploads/                # Zdjęcia przesyłane przez admina (custom karty, tła szablonów)
├── frontend/                  # Vue 3 + TailwindCSS (Vite)
│   └── src/
│       ├── api/                # Skonfigurowana instancja Axios
│       ├── components/cards/   # PlayerCard.vue — renderowanie karty + eksport PDF
│       ├── router/             # Vue Router + guard autoryzacji
│       ├── store/              # Pinia (stan zalogowanego użytkownika)
│       └── views/
│           ├── admin/          # Panel admina: karty, szablony, paczki, SBC
│           └── player/         # Panel gracza: skład, kolekcja, SBC, rynek, sklep
└── docs/                       # Dokumentacja API
```

## 🚀 Uruchomienie projektu

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

## 👥 Podział pracy (modułowy)

| Moduł | Pliki backend | Pliki frontend |
|-------|--------------|----------------|
| **Autoryzacja** | `controllers/authController.js`, `models/User.js` | `views/Login.vue`, `views/Register.vue`, `store/auth.js` |
| **Karty + Admin** | `controllers/cardController.js`, `services/sportsDbService.js` | `views/admin/AdminCards.vue`, `components/cards/PlayerCard.vue` |
| **Szablony** | `controllers/templateController.js`, `models/CardTemplate.js` | `views/admin/AdminTemplates.vue` |
| **Paczki** | `controllers/packController.js`, `services/packService.js` | `views/admin/AdminPacks.vue`, `views/player/Shop.vue` |
| **Skład** | `controllers/squadController.js`, `models/Squad.js` | `views/player/SquadView.vue` |
| **SBC** | `controllers/sbcController.js` | `views/admin/AdminSBC.vue`, `views/player/SBC.vue` |
| **Rynek** | `controllers/marketController.js` | `views/player/Market.vue` |

## 🔗 TheSportsDB API

Base URL: `https://www.thesportsdb.com/api/v1/json/3/`

Kluczowe endpointy użyte w projekcie — patrz `docs/api.md`
