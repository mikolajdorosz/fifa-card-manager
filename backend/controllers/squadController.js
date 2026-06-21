/**
 * controllers/squadController.js — Skład piłkarski gracza
 *
 * getSquad: Zwraca aktualny skład gracza (formacja + sloty + karty)
 * saveSquad: Zapisuje nowy skład (piłkarze na pozycjach + ławka)
 *   Aktualizuje isInSquad na UserCard
 */

const { Squad, SquadSlot, UserCard, Card, CardTemplate } = require('../models');

const squadController = {
  async getSquad(req, res) {
    try {
      const userId = req.user.id;

      let squad = await Squad.findOne({
        where: { userId },
        include: [{
          model: SquadSlot,
          as: 'slots',
          include: [{
            model: UserCard,
            as: 'userCard',
            include: [{ model: Card, as: 'card', include: [{ model: CardTemplate, as: 'template' }] }],
          }],
          order: [['slot', 'ASC']],
        }],
      });

      // Stwórz pusty skład jeśli gracz nie ma jeszcze żadnego
      if (!squad) {
        squad = await Squad.create({ userId, formation: '4-3-3' });
        squad.slots = [];
      }

      res.json(squad);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async saveSquad(req, res) {
    try {
      const userId = req.user.id;
      const { formation, players, bench } = req.body;
      // players: [{ userCardId, position, slot }] — piłkarze podstawowi
      // bench:   [{ userCardId, slot }]            — ławka

      let squad = await Squad.findOne({ where: { userId } });
      if (!squad) {
        squad = await Squad.create({ userId, formation: formation || '4-3-3' });
      } else {
        await squad.update({ formation: formation || squad.formation });
      }

      // Usuń stare sloty
      await SquadSlot.destroy({ where: { squadId: squad.id } });

      // Zresetuj isInSquad dla wszystkich kart gracza
      await UserCard.update({ isInSquad: false }, { where: { userId } });

      const allSlots = [];

      // Dodaj piłkarzy podstawowych
      if (players?.length) {
        for (const p of players) {
          if (p.userCardId) {
            allSlots.push({
              squadId: squad.id,
              userCardId: p.userCardId,
              position: p.position,
              slot: p.slot,
              isBench: false,
            });
            await UserCard.update({ isInSquad: true }, { where: { id: p.userCardId } });
          }
        }
      }

      // Dodaj ławkę
      if (bench?.length) {
        for (const b of bench) {
          if (b.userCardId) {
            allSlots.push({
              squadId: squad.id,
              userCardId: b.userCardId,
              position: 'SUB',
              slot: b.slot,
              isBench: true,
            });
            await UserCard.update({ isInSquad: true }, { where: { id: b.userCardId } });
          }
        }
      }

      await SquadSlot.bulkCreate(allSlots);

      // Przelicz overall składu
      const mainSlots = allSlots.filter(s => !s.isBench);
      if (mainSlots.length > 0) {
        const userCardIds = mainSlots.map(s => s.userCardId).filter(Boolean);
        const userCards = await UserCard.findAll({
          where: { id: userCardIds },
          include: [{ model: Card, as: 'card' }],
        });
        const ratings = userCards.map(uc => uc.card?.overall || 0).filter(r => r > 0);
        if (ratings.length) {
          const avg = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
          await squad.update({ overallRating: avg });
        }
      }

      res.json({ message: 'Skład zapisany', squadId: squad.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = squadController;
