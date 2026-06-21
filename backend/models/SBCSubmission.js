const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SBCSubmission = sequelize.define('SBCSubmission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sbcId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  submittedCardIds: {
    type: DataTypes.TEXT,
    get() { return JSON.parse(this.getDataValue('submittedCardIds') || '[]'); },
    set(v) { this.setDataValue('submittedCardIds', JSON.stringify(v)); },
  },
}, { tableName: 'sbc_submissions', timestamps: true });

module.exports = SBCSubmission;
