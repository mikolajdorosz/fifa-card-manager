/**
 * models/Squad.js — Skład piłkarski gracza
 *
 * Każdy gracz ma jeden aktywny skład.
 * Formacja (np. "4-3-3") decyduje o rozmieszczeniu slotów na boisku.
 * Logika rozmieszczenia piłkarzy wg formacji jest w komponencie
 * frontend/src/components/squad/SquadView.vue
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Squad = sequelize.define('Squad', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  formation: {
    type: DataTypes.STRING(10),
    defaultValue: '4-3-3',
    // Dostępne: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-3-2, 4-3-2-1
  },
  overallRating: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    // Obliczana po każdej zmianie składu
  },
}, { tableName: 'squads', timestamps: true });

module.exports = Squad;
