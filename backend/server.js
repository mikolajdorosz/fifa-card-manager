/**
 * server.js — Punkt wejściowy backendu
 *
 * Odpowiada za:
 * - Inicjalizację serwera Express
 * - Podłączenie middlewarów (CORS, JSON, upload)
 * - Rejestrację wszystkich tras (routes)
 * - Synchronizację bazy danych Sequelize
 *
 * Łączy się z: wszystkimi plikami w routes/, config/database.js
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./config/database");

// Import tras
const authRoutes = require("./routes/auth");
const cardRoutes = require("./routes/cards");
const templateRoutes = require("./routes/templates");
const packRoutes = require("./routes/packs");
const collectionRoutes = require("./routes/collection");
const squadRoutes = require("./routes/squad");
const sbcRoutes = require("./routes/sbc");
const marketRoutes = require("./routes/market");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? "https://twoja-domena.pl"
                : "*",
        credentials: true,
    }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serwowanie przesłanych zdjęć jako pliki statyczne
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Trasy API ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/packs", packRoutes);
app.use("/api/collection", collectionRoutes);
app.use("/api/squad", squadRoutes);
app.use("/api/sbc", sbcRoutes);
app.use("/api/market", marketRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Obsługa błędów ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("❌ Błąd serwera:", err.message);
    res.status(err.status || 500).json({
        error: err.message || "Wewnętrzny błąd serwera",
    });
});

// ── Start ────────────────────────────────────────────────────────────────────
async function start(port) {
    try {
        // Wyłącz FOREIGN KEY constraints na czas migracji (SQLite wymaga tego przy ALTER TABLE)
        await sequelize.query("PRAGMA foreign_keys = OFF;");
        // sync({ alter: true }) aktualizuje kolumny bez usuwania danych.
        // Jeśli baza nie istnieje jeszcze — tworzy wszystkie tabele od nowa.
        await sequelize.sync({ alter: true });
        await sequelize.query("PRAGMA foreign_keys = ON;");
        console.log("✅ Baza danych zsynchronizowana");

        const server = app.listen(port, () => {
            console.log(`🚀 Serwer działa na http://localhost:${port}`);
            console.log(`📡 API dostępne pod http://localhost:${port}/api`);
        });

        server.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                const nextPort = parseInt(port) + 1;
                console.error(
                    `❌ Port ${port} jest już zajęty, próbuję ${nextPort}...`,
                );
                start(nextPort);
            } else {
                console.error("❌ Błąd serwera:", err);
            }
        });
    } catch (error) {
        console.error("❌ Błąd podczas startu:", error);
        process.exit(1);
    }
}

start(PORT);
