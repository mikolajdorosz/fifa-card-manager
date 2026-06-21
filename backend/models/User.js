/**
 * models/User.js — Model użytkownika
 *
 * Przechowuje dane kont graczy i adminów.
 * Pole `role` decyduje o uprawnieniach: 'player' lub 'admin'.
 * Pole `coins` to waluta w grze, używana do kupowania paczek i kart na rynku.
 * Pole `points` to punkty rankingowe (zarezerwowane na przyszłe funkcje).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    // Hasło jest hashowane w authController.js przed zapisem
  },
  role: {
    type: DataTypes.ENUM('player', 'admin'),
    defaultValue: 'player',
  },
  coins: {
    type: DataTypes.INTEGER,
    defaultValue: 1000, // Każdy nowy gracz dostaje startowe 1000 monet
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // Punkty rankingowe
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
