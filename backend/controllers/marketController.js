/**
 * controllers/marketController.js — Rynek transferowy
 *
 * getListings: Lista aktywnych ofert (z filtrowaniem)
 * listCard: Gracz wystawia swoją kartę na sprzedaż
 * buyCard: Gracz kupuje kartę od innego gracza
 *   - Transfer monet: kupujący → sprzedający
 *   - Transfer UserCard: zmiana userId
 *   - Status oferty zmieniany ATOMOWO (Market.update z warunkiem status='active'),
 *     żeby dwóch graczy nie mogło kupić tej samej karty równocześnie
 * cancelListing: Gracz wycofuje swoją ofertę (również atomowo)
 */

const { Market, UserCard, Card, CardTemplate, User } = require("../models");
const { Op } = require("sequelize");

const marketController = {
    async getListings(req, res) {
        try {
            const {
                search,
                minPrice,
                maxPrice,
                page = 1,
                limit = 20,
            } = req.query;
            const where = { status: "active" };
            if (minPrice) where.price = { [Op.gte]: parseInt(minPrice) };
            if (maxPrice)
                where.price = { ...where.price, [Op.lte]: parseInt(maxPrice) };

            const cardWhere = {};
            if (search) cardWhere.playerName = { [Op.like]: `%${search}%` };

            const { count, rows } = await Market.findAndCountAll({
                where,
                include: [
                    {
                        model: UserCard,
                        as: "userCard",
                        include: [
                            {
                                model: Card,
                                as: "card",
                                where: cardWhere,
                                include: [
                                    { model: CardTemplate, as: "template" },
                                ],
                            },
                        ],
                    },
                    {
                        model: User,
                        as: "seller",
                        attributes: ["id", "username"],
                    },
                ],
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                order: [["createdAt", "DESC"]],
            });

            res.json({ listings: rows, total: count });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async listCard(req, res) {
        try {
            const { userCardId, price } = req.body;
            const sellerId = req.user.id;

            if (!price || price < 1)
                return res
                    .status(400)
                    .json({ error: "Cena musi być większa od 0" });

            const userCard = await UserCard.findOne({
                where: { id: userCardId, userId: sellerId },
            });
            if (!userCard)
                return res
                    .status(404)
                    .json({ error: "Nie posiadasz tej karty" });
            if (userCard.isListed)
                return res
                    .status(400)
                    .json({ error: "Karta jest już wystawiona" });
            if (userCard.isInSquad)
                return res.status(400).json({
                    error: "Wyjmij kartę ze składu przed wystawieniem",
                });

            await userCard.update({ isListed: true });
            const listing = await Market.create({
                userCardId,
                sellerId,
                price: parseInt(price),
            });

            res.status(201).json(listing);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async buyCard(req, res) {
        try {
            const listing = await Market.findByPk(req.params.id, {
                include: [{ model: UserCard, as: "userCard" }],
            });

            if (!listing || listing.status !== "active") {
                return res
                    .status(404)
                    .json({ error: "Oferta nie istnieje lub jest nieaktywna" });
            }

            const buyerId = req.user.id;
            if (buyerId === listing.sellerId) {
                return res
                    .status(400)
                    .json({ error: "Nie możesz kupić własnej karty" });
            }

            const buyer = await User.findByPk(buyerId);
            if (buyer.coins < listing.price) {
                return res.status(400).json({
                    error: `Niewystarczające środki (${buyer.coins} / ${listing.price})`,
                });
            }

            // Atomowo "zajmij" ofertę: update przechodzi tylko jeśli status nadal
            // jest 'active' w bazie. Gdyby dwóch graczy kliknęło "Kup" w tej samej
            // chwili, tylko jedno żądanie zmieni status — drugie dostanie affectedCount=0
            // i zwróci błąd zamiast podwójnie sprzedać tę samą kartę.
            const [affectedCount] = await Market.update(
                { status: "sold", buyerId, soldAt: new Date() },
                { where: { id: listing.id, status: "active" } },
            );
            if (affectedCount === 0) {
                return res.status(409).json({
                    error: "Ktoś inny był szybszy — oferta nie jest już dostępna",
                });
            }

            // Transfer monet — obie operacje przez statyczne increment/decrement
            // (bezpośredni UPDATE w bazie), żeby nie operować na ewentualnie
            // nieaktualnej instancji `buyer` pobranej wcześniej w tej funkcji.
            await User.decrement("coins", {
                by: listing.price,
                where: { id: buyerId },
            });
            await User.increment("coins", {
                by: listing.price,
                where: { id: listing.sellerId },
            });

            // Transfer karty — dezaktywuje ofertę u sprzedającego i przenosi własność
            await listing.userCard.update({ userId: buyerId, isListed: false });

            res.json({ message: "Karta kupiona pomyślnie" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async cancelListing(req, res) {
        try {
            const listing = await Market.findByPk(req.params.id, {
                include: [{ model: UserCard, as: "userCard" }],
            });

            if (!listing || listing.status !== "active") {
                return res.status(404).json({ error: "Oferta nie istnieje" });
            }

            if (listing.sellerId !== req.user.id) {
                return res
                    .status(403)
                    .json({ error: "Możesz wycofać tylko swoje oferty" });
            }

            // Atomowo zmień status tylko jeśli wciąż jest 'active' (zabezpieczenie
            // przed wyścigiem z równoczesnym zakupem tej samej karty).
            const [affectedCount] = await Market.update(
                { status: "cancelled" },
                { where: { id: listing.id, status: "active" } },
            );
            if (affectedCount === 0) {
                return res.status(409).json({
                    error: "Oferta została już sprzedana lub wycofana",
                });
            }

            await listing.userCard.update({ isListed: false });

            res.json({ message: "Oferta wycofana" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};

module.exports = marketController;
