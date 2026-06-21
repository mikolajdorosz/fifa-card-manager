/**
 * config/database.js — Konfiguracja połączenia z bazą danych SQLite
 *
 * Używa Sequelize ORM, który pozwala operować na danych przez obiekty JavaScript
 * zamiast pisania surowego SQL. SQLite przechowuje całą bazę w jednym pliku .sqlite,
 * co jest idealne do projektów uczelnianych — nie wymaga instalacji serwera DB.
 *
 * Łączy się z: wszystkimi plikami w models/ oraz server.js
 */

const { Sequelize } = require("sequelize");
const path = require("path");

const dbPath =
    process.env.DB_PATH || path.join(__dirname, "..", "database.sqlite");

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dbPath,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
});

module.exports = { sequelize };
