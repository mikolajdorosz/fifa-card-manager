/**
 * models/Card.js — Model karty piłkarskiej
 *
 * Karty tworzy wyłącznie admin. Mogą pochodzić z TheSportsDB API
 * (pole sportsDbId jest ustawione) lub być customowe (brak sportsDbId,
 * imageUrl wskazuje na lokalny plik w /uploads).
 *
 * Statystyki (stats) przechowywane są jako JSON:
 * { pace, shooting, passing, dribbling, defending, physical }
 * każda od 0 do 99.
 *
 * Pole `overall` to automatycznie obliczana średnia statystyk
 * (lub ręcznie ustawiona przez admina).
 *
 * Łączy się z:
 * - models/CardTemplate.js (belongsTo) — szablon wyglądu
 * - models/UserCard.js (hasMany) — karty posiadane przez graczy
 * - models/PackCard.js (hasMany) — przypisanie do paczek
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Card = sequelize.define('Card', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // ── Dane piłkarza ──────────────────────────────────────────────────────────
  playerName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  position: {
    type: DataTypes.STRING(5),
    allowNull: false,
    // Skrót pozycji: GK, LB, CB, RB, CDM, CM, CAM, LW, RW, ST, CF
  },
  nationality: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  team: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  league: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // ── Statystyki ─────────────────────────────────────────────────────────────
  overall: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 75,
    validate: { min: 0, max: 99 },
  },
  stats: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{"pace":70,"shooting":70,"passing":70,"dribbling":70,"defending":50,"physical":70}',
    // Getter/setter konwertuje JSON string ↔ obiekt
    get() {
      const raw = this.getDataValue('stats');
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    },
    set(val) {
      this.setDataValue('stats', typeof val === 'string' ? val : JSON.stringify(val));
    },
  },

  // ── Zdjęcie ────────────────────────────────────────────────────────────────
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    // Dla kart z API: URL do TheSportsDB (cutout/thumb)
    // Dla kart custom: ścieżka lokalna /uploads/filename.jpg
  },

  // ── Powiązanie z API ───────────────────────────────────────────────────────
  sportsDbId: {
    type: DataTypes.STRING(20),
    allowNull: true,
    // idPlayer z TheSportsDB. Null = karta customowa
  },

  // ── Powiązanie z szablonem ─────────────────────────────────────────────────
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'card_templates', key: 'id' },
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    // Admin może dezaktywować kartę (nie pojawi się w nowych paczkach)
  },
}, {
  tableName: 'cards',
  timestamps: true,
});

module.exports = Card;
