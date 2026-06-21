/**
 * models/UserCard.js — Karta należąca do konkretnego gracza
 *
 * Relacja wiele-do-wielu między User i Card.
 * Jeden gracz może mieć wiele kopii tej samej karty.
 * isListed = true gdy karta jest wystawiona na rynek transferowy.
 * isInSquad = true gdy karta jest aktualnie w składzie.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserCard = sequelize.define('UserCard', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  cardId: { type: DataTypes.INTEGER, allowNull: false },
  isListed: { type: DataTypes.BOOLEAN, defaultValue: false },
  isInSquad: { type: DataTypes.BOOLEAN, defaultValue: false },
  obtainedFrom: {
    type: DataTypes.STRING(20),
    defaultValue: 'pack', // 'pack', 'market', 'sbc_reward', 'seed'
  },
}, { tableName: 'user_cards', timestamps: true });

module.exports = UserCard;
