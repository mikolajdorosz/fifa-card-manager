# 📡 Dokumentacja API

## TheSportsDB API (zewnętrzne)

Base URL: `https://www.thesportsdb.com/api/v1/json/3/`

> Klucz API: `3` (darmowy tier). Nie wymaga rejestracji.

### Endpointy używane w projekcie

#### 1. Wyszukiwanie piłkarzy
```
GET /searchplayers.php?p={name}
```
**Użycie:** Panel admina → tworzenie karty → wyszukiwanie piłkarza po nazwisku  
**Zwraca:**
```json
{
  "player": [
    {
      "idPlayer": "34145937",
      "strPlayer": "Lionel Messi",
      "strTeam": "Inter Miami CF",
      "strNationality": "Argentine",
      "strPosition": "Forward",
      "strThumb": "https://www.thesportsdb.com/images/media/player/thumb/...",
      "strCutout": "https://www.thesportsdb.com/images/media/player/cutout/...",
      "strBanner": "https://...",
      "strHeight": "1.70 m",
      "strWeight": "72 kg",
      "dateBorn": "1987-06-24",
      "strDescriptionEN": "Lionel Messi is an Argentine...",
      "intLoved": "99",
      "strSigning": "$54,000,000"
    }
  ]
}
```

#### 2. Szczegóły piłkarza po ID
```
GET /lookupplayer.php?id={playerId}
```
**Użycie:** Po wybraniu piłkarza z listy — pobranie pełnych danych do karty  
**Zwraca:** Identyczna struktura jak wyżej, ale pojedynczy rekord z dodatkowymi polami:
```json
{
  "players": [
    {
      "idPlayer": "34145937",
      "strPlayer": "Lionel Messi",
      "strTeam": "Inter Miami CF",
      "strLeague": "Major League Soccer",
      "strNationality": "Argentine",
      "strPosition": "Forward",
      "strNumber": "10",
      "strAge": "37",
      "strHeight": "1.70 m",
      "strWeight": "72 kg",
      "strThumb": "https://...",
      "strCutout": "https://...",
      "strRender": "https://...",
      "intLoved": "99"
    }
  ]
}
```

#### 3. Wszyscy gracze drużyny
```
GET /lookup_all_players.php?id={teamId}
```
**Użycie:** Admin może przeglądać całą drużynę i wybierać graczy do kart  
**Zwraca:** Lista graczy (jak wyżej, wiele rekordów)

#### 4. Wyszukiwanie drużyny
```
GET /searchteams.php?t={teamName}
```
**Użycie:** Admin wyszukuje drużynę, aby potem pobrać jej skład  
**Zwraca:**
```json
{
  "teams": [
    {
      "idTeam": "133604",
      "strTeam": "Real Madrid",
      "strLeague": "La Liga",
      "strCountry": "Spain",
      "strTeamBadge": "https://...",
      "strTeamJersey": "https://...",
      "strTeamLogo": "https://..."
    }
  ]
}
```

#### 5. Wszystkie ligi
```
GET /all_leagues.php
```
**Użycie:** Filtrowanie/kategorie kart w kolekcji gracza  
**Zwraca:**
```json
{
  "leagues": [
    {
      "idLeague": "4328",
      "strLeague": "English Premier League",
      "strSport": "Soccer",
      "strLeagueAlternate": "Premier League"
    }
  ]
}
```

---

## Backend API (wewnętrzne)

Base URL: `http://localhost:3001/api`

### 🔐 Autoryzacja

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/auth/register` | Rejestracja nowego użytkownika |
| POST | `/auth/login` | Logowanie, zwraca JWT token |
| GET | `/auth/me` | Dane zalogowanego użytkownika |

**POST /auth/register**
```json
// Body
{ "username": "player1", "email": "p@p.pl", "password": "haslo123" }
// Response
{ "token": "eyJ...", "user": { "id": 1, "username": "player1", "coins": 1000, "role": "player" } }
```

**POST /auth/login**
```json
// Body
{ "email": "p@p.pl", "password": "haslo123" }
// Response
{ "token": "eyJ...", "user": { "id": 1, "username": "player1", "coins": 1000, "role": "player" } }
```

---

### 🎴 Karty (Cards)

| Metoda | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/cards` | Lista wszystkich kart (z filtrowaniem) | - |
| GET | `/cards/:id` | Szczegóły jednej karty | - |
| POST | `/cards` | Utwórz kartę (z danych API) | Admin |
| POST | `/cards/custom` | Utwórz kartę customową (upload zdjęcia) | Admin |
| PUT | `/cards/:id` | Edytuj kartę | Admin |
| DELETE | `/cards/:id` | Usuń kartę | Admin |
| GET | `/cards/search-player?name=Messi` | Wyszukaj piłkarza w TheSportsDB | Admin |

**GET /cards?league=Premier League&position=Forward&rarity=gold**
```json
{
  "cards": [
    {
      "id": 1,
      "playerName": "Lionel Messi",
      "position": "RW",
      "nationality": "Argentine",
      "team": "Inter Miami CF",
      "league": "MLS",
      "overall": 91,
      "rarity": "gold",
      "templateId": 2,
      "stats": { "pace": 85, "shooting": 92, "passing": 91, "dribbling": 95, "defending": 34, "physical": 65 },
      "imageUrl": "https://www.thesportsdb.com/...",
      "template": { "id": 2, "name": "Gold Rare", "cssClass": "card-gold-rare", "bgColor": "#c8a84b" }
    }
  ],
  "total": 150,
  "page": 1
}
```

---

### 🖼️ Szablony kart (Templates)

| Metoda | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/templates` | Lista wszystkich szablonów | - |
| POST | `/templates` | Utwórz szablon | Admin |
| PUT | `/templates/:id` | Edytuj szablon | Admin |
| DELETE | `/templates/:id` | Usuń szablon | Admin |

**POST /templates**
```json
// Body
{
  "name": "Gold Rare",
  "bgColor": "#c8a84b",
  "borderColor": "#f0d060",
  "textColor": "#1a1a1a",
  "cssClass": "card-gold-rare",
  "rarity": "gold"
}
```

---

### 📦 Paczki (Packs)

| Metoda | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/packs` | Lista paczek w sklepie | - |
| POST | `/packs` | Utwórz paczkę | Admin |
| POST | `/packs/:id/open` | Kup i otwórz paczkę | Player |
| GET | `/packs/:id` | Szczegóły paczki | - |

**POST /packs/:id/open — Response**
```json
{
  "success": true,
  "coinsSpent": 1000,
  "coinsRemaining": 2500,
  "cards": [
    { "id": 5, "playerName": "Cristiano Ronaldo", "overall": 88, "rarity": "gold", ... },
    { "id": 12, "playerName": "Bukayo Saka", "overall": 82, "rarity": "silver", ... }
  ]
}
```

---

### 👤 Kolekcja gracza (Collection)

| Metoda | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/collection` | Moja kolekcja kart | Player |
| GET | `/collection/:userId` | Kolekcja konkretnego gracza | - |

---

### ⚔️ Skład (Squad)

| Metoda | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/squad` | Mój aktualny skład | Player |
| PUT | `/squad` | Zapisz skład (formacja + piłkarze) | Player |

**PUT /squad — Body**
```json
{
  "formation": "4-3-3",
  "players": [
    { "cardId": 5, "position": "GK", "slot": 0 },
    { "cardId": 12, "position": "LB", "slot": 1 }
  ],
  "bench": [ { "cardId": 7, "slot": 0 } ]
}
```

---

### 🏆 SBC (Squad Building Challenges)

| Metoda | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/sbc` | Lista aktywnych wyzwań | Player |
| POST | `/sbc` | Utwórz wyzwanie | Admin |
| POST | `/sbc/:id/submit` | Wyślij skład do wyzwania | Player |

**POST /sbc/:id/submit — Body**
```json
{
  "cards": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
}
```
**Response:**
```json
{
  "success": true,
  "message": "Wyzwanie ukończone!",
  "reward": { "packId": 3, "packName": "Gold Pack", "cards": [...] }
}
```

---

### 💰 Rynek transferowy (Market)

| Metoda | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/market` | Lista aktywnych ofert | Player |
| POST | `/market` | Wystaw kartę na sprzedaż | Player |
| POST | `/market/:id/buy` | Kup kartę | Player |
| DELETE | `/market/:id` | Wycofaj ofertę | Player |

**POST /market — Body**
```json
{ "userCardId": 42, "price": 5000 }
```
