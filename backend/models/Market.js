/**
 * models/Market.js — Rynek transferowy
 *
 * Gracz wystawia UserCard na sprzedaż z określoną ceną.
 * Status: 'active' | 'sold' | 'cancelled'
 * Po zakupie: buyerId jest ustawiany, status → 'sold',
 * monety są transferowane między graczami w marketController.js
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Market = sequelize.define('Market', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userCardId: { type: DataTypes.INTEGER, allowNull: false },
  sellerId: { type: DataTypes.INTEGER, allowNull: false },
  buyerId: { type: DataTypes.INTEGER, allowNull: true },
  price: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'sold', 'cancelled'),
    defaultValue: 'active',
  },
  soldAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'market', timestamps: true });

module.exports = Market;
