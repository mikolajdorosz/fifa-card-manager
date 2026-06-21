/**
 * models/SquadSlot.js — Slot w składzie piłkarskim
 *
 * Jeden rekord = jedno miejsce w składzie lub na ławce.
 * slot: 0–10 = piłkarze podstawowi, 11–15 = ławka rezerwowych
 * position: pozycja na boisku (GK, LB, CB, RB, CDM, CM, CAM, LW, RW, ST)
 * isBench: true gdy to slot ławki rezerwowych
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SquadSlot = sequelize.define('SquadSlot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  squadId: { type: DataTypes.INTEGER, allowNull: false },
  userCardId: { type: DataTypes.INTEGER, allowNull: true },
  slot: { type: DataTypes.INTEGER, allowNull: false },
  position: { type: DataTypes.STRING(5), allowNull: false },
  isBench: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'squad_slots', timestamps: false });

module.exports = SquadSlot;
