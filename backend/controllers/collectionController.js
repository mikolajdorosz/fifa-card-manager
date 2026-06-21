/**
 * controllers/collectionController.js — Kolekcja kart gracza
 */
const { UserCard, Card, CardTemplate } = require('../models');
const { Op } = require('sequelize');

const collectionController = {
  async getMyCollection(req, res) {
    try {
      const { rarity, position, search, page = 1, limit = 24 } = req.query;
      const cardWhere = {};
      const templateWhere = {};

      if (position) cardWhere.position = position;
      if (search) cardWhere.playerName = { [Op.like]: `%${search}%` };
      if (rarity) templateWhere.rarity = rarity;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await UserCard.findAndCountAll({
        where: { userId: req.user.id },
        include: [{
          model: Card,
          as: 'card',
          where: cardWhere,
          include: [{ model: CardTemplate, as: 'template', where: templateWhere }],
        }],
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        userCards: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = collectionController;
