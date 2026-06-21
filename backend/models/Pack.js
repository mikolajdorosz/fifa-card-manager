/**
 * models/Pack.js — Paczka z kartami
 *
 * Admin definiuje paczki. Każda paczka ma:
 * - cenę w monetach
 * - liczbę kart do wylosowania (cardCount)
 * - wagi rzadkości (rarityWeights) — JSON określający
 *   procentowe szanse na wyciągnięcie karty danej rzadkości
 *
 * Przykład rarityWeights:
 * { "bronze": 60, "silver": 30, "gold": 9, "gold-rare": 1, "special": 0 }
 *
 * Logika losowania znajduje się w services/packService.js
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pack = sequelize.define('Pack', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(80), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1000 },
  cardCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  imageUrl: { type: DataTypes.STRING, allowNull: true },
  rarityWeights: {
    type: DataTypes.TEXT,
    defaultValue: '{"bronze":60,"silver":30,"gold":9,"gold-rare":1,"special":0}',
    get() { return JSON.parse(this.getDataValue('rarityWeights')); },
    set(v) { this.setDataValue('rarityWeights', JSON.stringify(v)); },
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'packs', timestamps: true });

module.exports = Pack;
