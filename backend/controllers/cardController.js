/**
 * controllers/cardController.js — Zarządzanie kartami piłkarzy
 *
 * getAll: Pobiera karty z filtrowaniem (league, position, rarity, search)
 * getOne: Szczegóły jednej karty
 * createFromApi: Admin tworzy kartę na bazie danych z TheSportsDB
 * createCustom: Admin tworzy kartę z własnym zdjęciem (upload)
 * update: Admin edytuje kartę
 * remove: Admin usuwa kartę
 * searchApiPlayer: Wyszukiwanie piłkarzy w TheSportsDB (dla admina)
 * proxyImage: Pobiera zewnętrzne zdjęcie (np. z TheSportsDB) przez backend
 *   i zwraca je jako odpowiedź tego serwera. Dzięki temu przeglądarka
 *   traktuje obrazek jako pochodzący z tej samej domeny (przez proxy Vite),
 *   więc rysowanie go na <canvas> w PlayerCard.vue (eksport PDF) nie jest
 *   blokowane przez CORS, nawet gdy TheSportsDB nie wysyła nagłówka
 *   Access-Control-Allow-Origin (żądania serwer→serwer nie podlegają CORS).
 */

const axios = require("axios");
const { Card, CardTemplate } = require("../models");
const sportsDbService = require("../services/sportsDbService");
const { Op } = require("sequelize");

const cardController = {
    async getAll(req, res) {
        try {
            const {
                league,
                position,
                rarity,
                search,
                page = 1,
                limit = 20,
            } = req.query;
            const where = { isActive: true };
            const templateWhere = {};

            if (position) where.position = position;
            if (league) where.league = { [Op.like]: `%${league}%` };
            if (search) where.playerName = { [Op.like]: `%${search}%` };
            if (rarity) templateWhere.rarity = rarity;

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows } = await Card.findAndCountAll({
                where,
                include: [
                    {
                        model: CardTemplate,
                        as: "template",
                        where: templateWhere,
                    },
                ],
                limit: parseInt(limit),
                offset,
                order: [["overall", "DESC"]],
            });

            res.json({
                cards: rows,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit),
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async getOne(req, res) {
        try {
            const card = await Card.findByPk(req.params.id, {
                include: [{ model: CardTemplate, as: "template" }],
            });
            if (!card)
                return res.status(404).json({ error: "Karta nie istnieje" });
            res.json(card);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Admin: utwórz kartę na podstawie danych z TheSportsDB API
    async createFromApi(req, res) {
        try {
            const { sportsDbId, templateId, stats, overall } = req.body;
            if (!sportsDbId || !templateId) {
                return res
                    .status(400)
                    .json({ error: "Wymagane: sportsDbId, templateId" });
            }

            const template = await CardTemplate.findByPk(templateId);
            if (!template)
                return res.status(404).json({ error: "Szablon nie istnieje" });

            const apiPlayer = await sportsDbService.getPlayerById(sportsDbId);
            if (!apiPlayer)
                return res
                    .status(404)
                    .json({ error: "Piłkarz nie znaleziony w TheSportsDB" });

            const mapped = sportsDbService.mapPlayerToCard(apiPlayer);

            const card = await Card.create({
                ...mapped,
                templateId,
                ...(stats && { stats }),
                ...(overall && { overall }),
            });

            const result = await Card.findByPk(card.id, {
                include: [{ model: CardTemplate, as: "template" }],
            });
            res.status(201).json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Admin: utwórz kartę z własnym zdjęciem
    async createCustom(req, res) {
        try {
            const {
                playerName,
                position,
                nationality,
                team,
                league,
                overall,
                stats,
                templateId,
                age,
            } = req.body;

            if (!playerName || !position || !templateId) {
                return res.status(400).json({
                    error: "Wymagane: playerName, position, templateId",
                });
            }

            const template = await CardTemplate.findByPk(templateId);
            if (!template)
                return res.status(404).json({ error: "Szablon nie istnieje" });

            let imageUrl = null;
            if (req.file) {
                imageUrl = `/uploads/${req.file.filename}`;
            }

            const card = await Card.create({
                playerName,
                position,
                nationality: nationality || null,
                team: team || null,
                league: league || null,
                age: age ? parseInt(age) : null,
                overall: parseInt(overall) || 75,
                stats: stats
                    ? typeof stats === "string"
                        ? JSON.parse(stats)
                        : stats
                    : undefined,
                imageUrl,
                templateId,
                sportsDbId: null,
            });

            const result = await Card.findByPk(card.id, {
                include: [{ model: CardTemplate, as: "template" }],
            });
            res.status(201).json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async update(req, res) {
        try {
            const card = await Card.findByPk(req.params.id);
            if (!card)
                return res.status(404).json({ error: "Karta nie istnieje" });

            await card.update(req.body);
            const result = await Card.findByPk(card.id, {
                include: [{ model: CardTemplate, as: "template" }],
            });
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async remove(req, res) {
        try {
            const card = await Card.findByPk(req.params.id);
            if (!card)
                return res.status(404).json({ error: "Karta nie istnieje" });
            await card.destroy();
            res.json({ message: "Karta usunięta" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Wyszukiwanie piłkarzy w TheSportsDB (dla panelu admina)
    async searchApiPlayer(req, res) {
        try {
            const { name } = req.query;
            if (!name || name.length < 2) {
                return res
                    .status(400)
                    .json({ error: "Podaj co najmniej 2 znaki" });
            }
            const players = await sportsDbService.searchPlayers(name);
            res.json(players.slice(0, 20)); // Max 20 wyników
        } catch (err) {
            res.status(500).json({
                error: "Błąd komunikacji z TheSportsDB: " + err.message,
            });
        }
    },

    // Pobierz piłkarza z API po ID (podgląd przed utworzeniem karty)
    async previewApiPlayer(req, res) {
        try {
            const player = await sportsDbService.getPlayerById(req.params.id);
            if (!player)
                return res
                    .status(404)
                    .json({ error: "Nie znaleziono piłkarza" });
            res.json(sportsDbService.mapPlayerToCard(player));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Proxy obrazków — omija CORS przy rysowaniu zdjęć na <canvas> (eksport PDF).
    // Akceptuje tylko URL z whitelisty (TheSportsDB) lub lokalne /uploads,
    // żeby endpoint nie posłużył jako otwarty proxy do dowolnych adresów.
    async proxyImage(req, res) {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: "Brak parametru url" });

        // Whitelist domen — tylko zaufane serwisy obrazkowe
        const allowed = ["thesportsdb.com", "ui-avatars.com", "localhost"];
        const isAllowed = allowed.some((domain) => url.includes(domain));
        if (!isAllowed)
            return res.status(403).json({ error: "Niedozwolona domena" });

        try {
            const response = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 8000,
                headers: { "User-Agent": "FIFACardManager/1.0" },
            });

            const contentType =
                response.headers["content-type"] || "image/jpeg";
            res.set("Content-Type", contentType);
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Cache-Control", "public, max-age=3600"); // cache 1h
            res.send(Buffer.from(response.data));
        } catch (err) {
            res.status(502).json({
                error: "Nie udało się pobrać obrazka: " + err.message,
            });
        }
    },
};

module.exports = cardController;
