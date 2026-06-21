const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SBCRequirement = sequelize.define('SBCRequirement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sbcId: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM('minOverall', 'nationality', 'league', 'team', 'position', 'playerCount'),
    allowNull: false,
  },
  value: { type: DataTypes.STRING(100), allowNull: false },
  label: { type: DataTypes.STRING(100), allowNull: true },
}, { tableName: 'sbc_requirements', timestamps: false });

module.exports = SBCRequirement;
