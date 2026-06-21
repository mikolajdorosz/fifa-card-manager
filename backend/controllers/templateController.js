/**
 * controllers/templateController.js — Zarządzanie szablonami kart
 *
 * Admin definiuje szablony (ramki/tła kart). Zmiana szablonu automatycznie
 * zmienia wygląd wszystkich kart bazujących na nim (live rendering).
 *
 * `cssClass` NIE jest przyjmowane z requestu admina — jest automatycznie
 * wyprowadzane z `rarity` (RARITY_TO_CSS_CLASS), żeby admin nie musiał
 * znać ani wpisywać nazw klas CSS z main.css.
 */

const { CardTemplate } = require("../models");

const RARITY_TO_CSS_CLASS = {
    bronze: "bronze",
    silver: "silver",
    gold: "gold",
    "gold-rare": "gold-rare",
    special: "special",
};

// Usuwa cssClass z body, żeby admin nie mógł go nadpisać ręcznie nawet
// gdyby ktoś wysłał własne żądanie z pominięciem formularza we frontendzie.
function sanitizeTemplateBody(body) {
    const { cssClass, ...rest } = body;
    return {
        ...rest,
        cssClass: RARITY_TO_CSS_CLASS[body.rarity] || "gold",
    };
}

const templateController = {
    async getAll(req, res) {
        try {
            const templates = await CardTemplate.findAll({
                order: [["rarity", "ASC"]],
            });
            res.json(templates);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async create(req, res) {
        try {
            const template = await CardTemplate.create(
                sanitizeTemplateBody(req.body),
            );
            res.status(201).json(template);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async update(req, res) {
        try {
            const t = await CardTemplate.findByPk(req.params.id);
            if (!t)
                return res.status(404).json({ error: "Szablon nie istnieje" });
            const payload = req.body.rarity
                ? sanitizeTemplateBody(req.body)
                : (() => {
                      const { cssClass, ...rest } = req.body;
                      return rest;
                  })();
            await t.update(payload);
            res.json(t);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async remove(req, res) {
        try {
            const t = await CardTemplate.findByPk(req.params.id);
            if (!t)
                return res.status(404).json({ error: "Szablon nie istnieje" });
            await t.destroy();
            res.json({ message: "Szablon usunięty" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Przesyła obrazek tła dla szablonu (alternatywa dla koloru jednolitego).
    // Plik trafia do /uploads (tak samo jak custom zdjęcia piłkarzy) i jego
    // URL zapisywany jest w backgroundImageUrl — od tej pory karta renderuje
    // ten obraz jako tło zamiast bgColor (patrz PlayerCard.vue → cardStyle).
    async uploadBackgroundImage(req, res) {
        try {
            const t = await CardTemplate.findByPk(req.params.id);
            if (!t)
                return res.status(404).json({ error: "Szablon nie istnieje" });
            if (!req.file)
                return res.status(400).json({ error: "Brak pliku obrazka" });

            await t.update({
                backgroundImageUrl: `/uploads/${req.file.filename}`,
            });
            res.json(t);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};

module.exports = templateController;
