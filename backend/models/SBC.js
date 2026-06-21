/**
 * models/SBC.js — Squad Building Challenge
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SBC = sequelize.define(
    "SBC",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        rewardPackId: { type: DataTypes.INTEGER, allowNull: false },
        expiresAt: { type: DataTypes.DATE, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: "sbcs", timestamps: true },
);

module.exports = SBC;
