/**
 * controllers/authController.js — Rejestracja, logowanie, profil
 *
 * register: Hashuje hasło → tworzy User → zwraca JWT
 * login: Weryfikuje hasło → zwraca JWT
 * me: Zwraca dane zalogowanego użytkownika (z tokenu)
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
    );
};

const authController = {
    async register(req, res) {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    error: "Wymagane pola: username, email, password",
                });
            }

            const exists = await User.findOne({ where: { email } });
            if (exists) {
                return res
                    .status(409)
                    .json({ error: "Ten email jest już zajęty" });
            }

            const hashed = await bcrypt.hash(password, 10);
            // Nowy gracz zawsze dostaje 10000 monet, rolę 'player'
            const user = await User.create({
                username,
                email,
                password: hashed,
                coins: 10000,
                role: "player",
            });

            const token = generateToken(user);
            res.status(201).json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    coins: user.coins,
                },
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ where: { email } });
            if (!user)
                return res
                    .status(401)
                    .json({ error: "Nieprawidłowy email lub hasło" });

            const valid = await bcrypt.compare(password, user.password);
            if (!valid)
                return res
                    .status(401)
                    .json({ error: "Nieprawidłowy email lub hasło" });

            const token = generateToken(user);
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    coins: user.coins,
                    points: user.points,
                },
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async me(req, res) {
        try {
            const user = await User.findByPk(req.user.id, {
                attributes: { exclude: ["password"] },
            });
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};

module.exports = authController;
