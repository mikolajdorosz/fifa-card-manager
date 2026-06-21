/**
 * controllers/sbcController.js — Squad Building Challenges
 *
 * getAll: Lista AKTYWNYCH wyzwań z wymaganiami (widok gracza — Shop/SBC.vue)
 * getAllAdmin: Lista WSZYSTKICH wyzwań, łącznie z ukrytymi (panel admina,
 *   żeby admin mógł zobaczyć i przywrócić wyzwania, które sam ukrył)
 * create: Admin tworzy SBC
 * toggleActive: Admin ukrywa/przywraca SBC (isActive)
 * submit: Gracz wysyła skład do wyzwania
 *   - Walidacja wymagań (overall, narodowość, liga)
 *   - Karty są ZUŻYWANE (usuwane z kolekcji)
 *   - Gracz otrzymuje nagrodę (otwiera paczkę)
 */

const { SBC, SBCRequirement, SBCSubmission, UserCard, Card, CardTemplate, Pack } = require('../models');
const packService = require('../services/packService');

const sbcController = {
  async getAll(req, res) {
    try {
      const sbcs = await SBC.findAll({
        where: { isActive: true },
        include: [{ model: SBCRequirement, as: 'requirements' }],
        order: [['createdAt', 'DESC']],
      });
      res.json(sbcs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Widok admina — pokazuje też ukryte SBC, żeby można je było przywrócić.
  async getAllAdmin(req, res) {
    try {
      const sbcs = await SBC.findAll({
        include: [{ model: SBCRequirement, as: 'requirements' }],
        order: [['createdAt', 'DESC']],
      });
      res.json(sbcs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name, description, rewardPackId, expiresAt, requirements } = req.body;
      const sbc = await SBC.create({ name, description, rewardPackId, expiresAt });

      if (requirements?.length) {
        await SBCRequirement.bulkCreate(requirements.map(r => ({ ...r, sbcId: sbc.id })));
      }

      const result = await SBC.findByPk(sbc.id, { include: [{ model: SBCRequirement, as: 'requirements' }] });
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Ukrywa lub przywraca SBC — ukryte wyzwania znikają z widoku gracza
  // (getAll filtruje isActive: true), ale pozostają w bazie razem
  // z historią zgłoszeń (SBCSubmission) i mogą być przywrócone.
  async toggleActive(req, res) {
    try {
      const sbc = await SBC.findByPk(req.params.id);
      if (!sbc) return res.status(404).json({ error: 'Wyzwanie nie istnieje' });
      await sbc.update({ isActive: !sbc.isActive });
      res.json(sbc);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async submit(req, res) {
    try {
      const { cardIds } = req.body; // ID UserCard do wysłania
      const userId = req.user.id;
      const sbcId = req.params.id;

      const sbc = await SBC.findByPk(sbcId, { include: [{ model: SBCRequirement, as: 'requirements' }] });
      if (!sbc || !sbc.isActive) return res.status(404).json({ error: 'Wyzwanie nie istnieje' });

      // Pobierz karty gracza
      const userCards = await UserCard.findAll({
        where: { id: cardIds, userId, isListed: false },
        include: [{ model: Card, as: 'card', include: [{ model: CardTemplate, as: 'template' }] }],
      });

      if (userCards.length !== cardIds.length) {
        return res.status(400).json({ error: 'Niektóre karty nie są dostępne (wystawione lub nie twoje)' });
      }

      // Walidacja wymagań
      const cards = userCards.map(uc => uc.card);
      const errors = [];

      for (const req_ of sbc.requirements) {
        switch (req_.type) {
          case 'minOverall': {
            const avg = Math.round(cards.reduce((s, c) => s + c.overall, 0) / cards.length);
            if (avg < parseInt(req_.value)) errors.push(`Wymagane min. overall: ${req_.value} (masz: ${avg})`);
            break;
          }
          case 'nationality': {
            const count = cards.filter(c => c.nationality?.toLowerCase().includes(req_.value.toLowerCase())).length;
            if (count < 1) errors.push(`Wymagana narodowość: ${req_.value}`);
            break;
          }
          case 'league': {
            const count = cards.filter(c => c.league?.toLowerCase().includes(req_.value.toLowerCase())).length;
            if (count < 1) errors.push(`Wymagana liga: ${req_.value}`);
            break;
          }
          case 'playerCount': {
            if (cards.length < parseInt(req_.value)) errors.push(`Wymagana liczba kart: ${req_.value}`);
            break;
          }
        }
      }

      if (errors.length) return res.status(400).json({ error: 'Wymagania niespełnione', details: errors });

      // Usuń karty z kolekcji gracza (są zużywane)
      await UserCard.destroy({ where: { id: cardIds } });

      // Zapisz zgłoszenie
      await SBCSubmission.create({ sbcId, userId, submittedCardIds: cardIds });

      // Otwórz paczkę nagrodę
      const rewardCards = await packService.openPack(sbc.rewardPackId, userId);
      const rewardPack = await Pack.findByPk(sbc.rewardPackId);

      res.json({
        success: true,
        message: 'Wyzwanie ukończone!',
        reward: { packName: rewardPack.name, cards: rewardCards },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = sbcController;
