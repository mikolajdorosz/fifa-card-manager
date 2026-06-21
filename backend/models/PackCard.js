/**
 * models/PackCard.js — Przypisanie karty do paczki
 *
 * Tabela pośrednia między Pack a Card.
 * Admin może ręcznie określić które karty mogą wypaść z danej paczki,
 * oraz nadpisać wagę konkretnej karty (weight).
 *
 * Jeśli packCards są puste dla danej paczki, serwis losuje
 * ze wszystkich aktywnych kart pasujących do rarityWeights paczki.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PackCard = sequelize.define('PackCard', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  packId: { type: DataTypes.INTEGER, allowNull: false },
  cardId: { type: DataTypes.INTEGER, allowNull: false },
  weight: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    // Wyższa waga = większa szansa na wylosowanie tej konkretnej karty
  },
}, { tableName: 'pack_cards', timestamps: false });

module.exports = PackCard;
