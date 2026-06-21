/**
 * models/CardTemplate.js — Model szablonu karty (ramki/tła)
 *
 * Admin definiuje szablony, które określają wygląd karty:
 * - nazwę, rzadkość (rarity) — używaną przy losowaniu z paczek
 * - kolory tła, obramowania i tekstu
 * - opcjonalnie: obrazek tła (backgroundImageUrl) zamiast koloru —
 *   gdy ustawiony, ma pierwszeństwo nad bgColor w renderowaniu karty
 *
 * UWAGA: pole `cssClass` NIE jest ustawiane ręcznie przez admina
 * (formularz w AdminTemplates.vue go nie pokazuje). Jest automatycznie
 * wyprowadzane z `rarity` w templateController.js, żeby zachować
 * kompatybilność z istniejącymi stylami w main.css (animacja
 * card-special itp.) bez wymagania od admina znajomości CSS.
 *
 * Karty (Card) odnoszą się do szablonu przez templateId.
 * Jeśli admin zmieni szablon, WSZYSTKIE karty bazujące na nim
 * automatycznie będą renderowane z nowym wyglądem — dzięki
 * dynamicznemu generowaniu kart na frontendzie.
 *
 * Łączy się z: models/Card.js (hasMany)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CardTemplate = sequelize.define('CardTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    // Przykład: "Gold Rare", "Special IF", "Bronze Common"
  },
  rarity: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'gold-rare', 'special'),
    allowNull: false,
  },
  bgColor: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#c8a84b',
    // Kolor tła karty w formacie hex lub CSS gradient string.
    // Ignorowany w renderowaniu, gdy ustawiony jest backgroundImageUrl.
  },
  borderColor: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#f0d060',
  },
  textColor: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#1a1a1a',
  },
  accentColor: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#8b6914',
    // Kolor akcentów: podkreślenia, ikonki statystyk
  },
  cssClass: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'card-gold',
    // Wyprowadzane automatycznie z `rarity` przez backend (nie edytowalne
    // przez admina). Zapewnia animacje/efekty zdefiniowane w main.css
    // (np. "card-special" ma efekt świecenia).
  },
  backgroundImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    // Opcjonalne tło — obrazek zamiast koloru. Gdy ustawione, karta
    // renderuje ten obraz jako background-image zamiast bgColor.
  },
}, {
  tableName: 'card_templates',
  timestamps: true,
});

module.exports = CardTemplate;
