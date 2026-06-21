/**
 * models/index.js — Rejestr wszystkich modeli i ich relacji
 *
 * Importuje każdy model i definiuje powiązania (associations) między nimi.
 * Sequelize na podstawie associations automatycznie tworzy klucze obce w SQLite.
 *
 * Hierarchia relacji:
 *   User ──< UserCard >── Card ──< Template
 *   Pack ──< PackCard >── Card
 *   Market ──< UserCard, User (seller, buyer)
 *   SBC ──< SBCRequirement, SBCSubmission
 *   Squad ──< User, SquadSlot >── UserCard
 */

const User = require('./User');
const Card = require('./Card');
const CardTemplate = require('./CardTemplate');
const UserCard = require('./UserCard');
const Pack = require('./Pack');
const PackCard = require('./PackCard');
const Squad = require('./Squad');
const SquadSlot = require('./SquadSlot');
const Market = require('./Market');
const SBC = require('./SBC');
const SBCRequirement = require('./SBCRequirement');
const SBCSubmission = require('./SBCSubmission');

// ── Card ←→ CardTemplate ─────────────────────────────────────────────────────
Card.belongsTo(CardTemplate, { foreignKey: 'templateId', as: 'template' });
CardTemplate.hasMany(Card, { foreignKey: 'templateId', as: 'cards' });

// ── UserCard ←→ User, Card ───────────────────────────────────────────────────
UserCard.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
UserCard.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });
User.hasMany(UserCard, { foreignKey: 'userId', as: 'userCards' });
Card.hasMany(UserCard, { foreignKey: 'cardId', as: 'userCards' });

// ── PackCard ←→ Pack, Card ───────────────────────────────────────────────────
PackCard.belongsTo(Pack, { foreignKey: 'packId', as: 'pack' });
PackCard.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });
Pack.hasMany(PackCard, { foreignKey: 'packId', as: 'packCards' });

// ── Squad ←→ User ────────────────────────────────────────────────────────────
Squad.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Squad, { foreignKey: 'userId', as: 'squad' });

// ── SquadSlot ←→ Squad, UserCard ─────────────────────────────────────────────
SquadSlot.belongsTo(Squad, { foreignKey: 'squadId', as: 'squad' });
SquadSlot.belongsTo(UserCard, { foreignKey: 'userCardId', as: 'userCard' });
Squad.hasMany(SquadSlot, { foreignKey: 'squadId', as: 'slots' });

// ── Market ←→ UserCard, User ─────────────────────────────────────────────────
Market.belongsTo(UserCard, { foreignKey: 'userCardId', as: 'userCard' });
Market.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Market.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

// ── SBC ←→ SBCRequirement, SBCSubmission ─────────────────────────────────────
SBCRequirement.belongsTo(SBC, { foreignKey: 'sbcId', as: 'sbc' });
SBC.hasMany(SBCRequirement, { foreignKey: 'sbcId', as: 'requirements' });
SBCSubmission.belongsTo(SBC, { foreignKey: 'sbcId', as: 'sbc' });
SBCSubmission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SBC.hasMany(SBCSubmission, { foreignKey: 'sbcId', as: 'submissions' });

module.exports = {
  User, Card, CardTemplate, UserCard,
  Pack, PackCard, Squad, SquadSlot,
  Market, SBC, SBCRequirement, SBCSubmission,
};
