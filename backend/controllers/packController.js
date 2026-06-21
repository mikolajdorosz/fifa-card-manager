/**
 * controllers/packController.js — Zarządzanie paczkami i ich otwieranie
 *
 * getAll: Lista aktywnych paczek (widoczna w sklepie)
 * create: Admin tworzy nową paczkę
 * update: Admin edytuje paczkę
 * openPack: Gracz kupuje i otwiera paczkę
 *   - Sprawdza czy gracz ma wystarczająco monet
 *   - Wywołuje packService.openPack() do losowania kart
 *   - Odejmuje monety z konta gracza
 *   - Zwraca wylosowane karty
 */

const { Pack, User, Card, CardTemplate } = require("../models");
const packService = require("../services/packService");

const packController = {
    async getAll(req, res) {
        try {
            const packs = await Pack.findAll({ where: { isActive: true } });
            res.json(packs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Widok admina — pokazuje też ukryte/nieaktywne paczki, żeby można je było przywrócić.
    async getAllAdmin(req, res) {
        try {
            const packs = await Pack.findAll();
            res.json(packs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async getOne(req, res) {
        try {
            const pack = await Pack.findByPk(req.params.id);
            if (!pack)
                return res.status(404).json({ error: "Paczka nie istnieje" });
            res.json(pack);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async create(req, res) {
        try {
            const pack = await Pack.create(req.body);
            res.status(201).json(pack);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async update(req, res) {
        try {
            const pack = await Pack.findByPk(req.params.id);
            if (!pack)
                return res.status(404).json({ error: "Paczka nie istnieje" });
            await pack.update(req.body);
            res.json(pack);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async toggleActive(req, res) {
        try {
            const pack = await Pack.findByPk(req.params.id);
            if (!pack)
                return res.status(404).json({ error: "Paczka nie istnieje" });
            await pack.update({ isActive: !pack.isActive });
            res.json(pack);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async openPack(req, res) {
        try {
            const { id: packId } = req.params;
            const userId = req.user.id;

            const [pack, user] = await Promise.all([
                Pack.findByPk(packId),
                User.findByPk(userId),
            ]);

            if (!pack || !pack.isActive) {
                return res
                    .status(404)
                    .json({ error: "Paczka nie istnieje lub jest nieaktywna" });
            }

            if (user.coins < pack.price) {
                return res.status(400).json({
                    error: `Niewystarczające środki. Masz ${user.coins} monet, paczka kosztuje ${pack.price}`,
                });
            }

            // Odejmij monety
            await user.decrement("coins", { by: pack.price });
            await user.reload();

            // Wylosuj karty — obsłuż błąd losowania osobno żeby móc zwrócić monety
            let cards = [];
            try {
                cards = await packService.openPack(packId, userId);
            } catch (packErr) {
                // Zwróć monety jeśli losowanie się nie powiodło
                await user.increment("coins", { by: pack.price });
                console.error("❌ Błąd losowania kart:", packErr);
                return res.status(500).json({
                    error: "Błąd podczas losowania kart: " + packErr.message,
                });
            }

            if (cards.length === 0) {
                // Brak kart w puli — zwróć monety
                await user.increment("coins", { by: pack.price });
                return res.status(500).json({
                    error: "Brak dostępnych kart w bazie. Uruchom seed: npm run seed",
                });
            }

            res.json({
                success: true,
                coinsSpent: pack.price,
                coinsRemaining: user.coins,
                cards,
            });
        } catch (err) {
            console.error("❌ openPack error:", err);
            res.status(500).json({ error: err.message });
        }
    },
};

module.exports = packController;
