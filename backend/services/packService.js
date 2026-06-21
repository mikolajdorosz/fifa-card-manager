/**
 * services/packService.js — Logika otwierania paczek i losowania kart
 *
 * Algorytm losowania:
 * 1. Weź wagi rzadkości paczki (rarityWeights)
 * 2. Dla każdej z N kart w paczce:
 *    a. Wylosuj rzadkość zgodnie z wagami (np. 60% bronze, 30% silver...)
 *    b. Pobierz wszystkie aktywne karty tej rzadkości
 *    c. Wylosuj konkretną kartę (uwzględniając wagi PackCard jeśli istnieją)
 * 3. Zapisz wylosowane karty jako UserCard i przypisz do gracza
 */

const { Card, CardTemplate, UserCard, Pack, PackCard } = require("../models");
const { Op } = require("sequelize");

const packService = {
    /**
     * Wylosuj rzadkość karty na podstawie wag
     * @param {Object} weights - { bronze: 60, silver: 30, gold: 9, 'gold-rare': 1, special: 0 }
     * @returns {string} rzadkość, np. 'gold'
     */
    rollRarity(weights) {
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;

        for (const [rarity, weight] of Object.entries(weights)) {
            rand -= weight;
            if (rand <= 0) return rarity;
        }
        return Object.keys(weights)[0]; // fallback
    },

    /**
     * Losuj kartę danej rzadkości
     * Jeśli paczka ma zdefiniowane PackCards, bierze z nich (z wagami).
     * W przeciwnym razie losuje z wszystkich aktywnych kart tej rzadkości.
     */
    async rollCard(rarity, packId, alreadyRolled = []) {
        // Sprawdź czy paczka ma zdefiniowane karty
        const packCards = await PackCard.findAll({
            where: { packId },
            include: [
                {
                    model: Card,
                    as: "card",
                    include: [{ model: CardTemplate, as: "template" }],
                },
            ],
        });

        let pool;

        if (packCards.length > 0) {
            // Użyj kart z paczki filtrując po rzadkości
            pool = packCards
                .filter(
                    (pc) =>
                        pc.card?.template?.rarity === rarity &&
                        pc.card?.isActive,
                )
                .map((pc) => ({ card: pc.card, weight: pc.weight }));
        }

        // Jeśli brak kart tej rzadkości w paczce, szukaj globalnie
        if (!pool || pool.length === 0) {
            const cards = await Card.findAll({
                where: { isActive: true },
                include: [
                    {
                        model: CardTemplate,
                        as: "template",
                        where: { rarity },
                    },
                ],
            });
            pool = cards.map((c) => ({ card: c, weight: 1 }));
        }

        if (pool.length === 0) return null;

        // Ważone losowanie
        const total = pool.reduce((s, p) => s + p.weight, 0);
        let rand = Math.random() * total;
        for (const item of pool) {
            rand -= item.weight;
            if (rand <= 0) return item.card;
        }
        return pool[0].card;
    },

    /**
     * Główna funkcja otwierania paczki
     * @param {number} packId - ID paczki
     * @param {number} userId - ID kupującego gracza
     * @returns {Array<Card>} Wylosowane karty
     */
    async openPack(packId, userId) {
        const pack = await Pack.findByPk(packId);
        if (!pack) throw new Error("Paczka nie istnieje");

        // Getter Sequelize zwraca obiekt, ale zabezpieczamy się na wypadek stringa
        let weights = pack.rarityWeights;
        if (typeof weights === "string") {
            try {
                weights = JSON.parse(weights);
            } catch {
                throw new Error("Nieprawidłowy format rarityWeights w paczce");
            }
        }

        if (!weights || typeof weights !== "object") {
            throw new Error("Brak konfiguracji wag rzadkości dla paczki");
        }

        const rolledCards = [];

        while (rolledCards.length < pack.cardCount) {
            const rarity = this.rollRarity(weights);
            const card = await this.rollCard(rarity, packId);

            if (!card) continue;

            const created = await UserCard.create({
                userId,
                cardId: card.id,
                obtainedFrom: "pack",
            });

            rolledCards.push({
                ...card.toJSON(),
                userCardId: created.id,
            });
        }

        return rolledCards;
    },
};

module.exports = packService;
