/**
 * middleware/auth.js — Middleware autoryzacji JWT
 *
 * Używany jako argument w trasach wymagających zalogowania:
 *   router.get('/collection', auth, collectionController.getMyCollection)
 *
 * Sprawdza nagłówek Authorization: Bearer <token>
 * Jeśli token jest ważny, dołącza req.user = { id, email, role }
 *
 * adminOnly: dodatkowy middleware sprawdzający role === 'admin'
 */

const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Brak tokenu autoryzacyjnego" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, role, username }
        next();
    } catch (err) {
        return res
            .status(401)
            .json({ error: "Token jest nieprawidłowy lub wygasł" });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res
            .status(403)
            .json({ error: "Tylko administrator ma dostęp do tego zasobu" });
    }
    next();
};

module.exports = { auth, adminOnly };
