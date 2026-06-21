/**
 * config/seed.js — Wypełnienie bazy danych danymi początkowymi
 *
 * Uruchom: npm run seed
 *
 * Tworzy:
 * - Admin (admin@fifa.pl / admin123):
 *      - 20 kart piłkarzy z TheSportsDB
 *      - 5 szablonów kart (Bronze → Special)
 *      - 3 paczki (Starter, Gold, Premium)
 *      - 1 przykładowe SBC z wymaganiami
 * - Gracz (player@fifa.pl / player123)
 *      - 10000 monet
 *      - 10 kart piłkarzy z TheSportsDB
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const axios = require("axios");
const { sequelize } = require("./database");

const {
    User,
    CardTemplate,
    Pack,
    Card,
    UserCard,
    SBC,
    SBCRequirement,
} = require("../models");

// ── TheSportsDB piłkarze do pobrania ─────────────────────────────────────────────────────────────────
// idPlayer z TheSportsDB (darmowe API, klucz "3")
const API_PLAYERS = [
    { id: 34146370, templateRarity: "special" }, // Messi
    { id: 34146304, templateRarity: "special" }, // Ronaldo
    { id: 34162098, templateRarity: "gold-rare" }, // Mbappé
    { id: 34169116, templateRarity: "gold-rare" }, // Haaland
    { id: 34146371, templateRarity: "gold-rare" }, // Neymar
    { id: 34146309, templateRarity: "gold" }, // Benzema
    { id: 34145506, templateRarity: "gold" }, // Salah
    { id: 34155057, templateRarity: "gold" }, // de Bruyne
    { id: 34146705, templateRarity: "gold" }, // Lewandowski
    { id: 34146306, templateRarity: "gold" }, // Modrić

    { id: 34178560, templateRarity: "silver" }, // Świderski
    { id: 34234127, templateRarity: "silver" }, // Żukowski
    { id: 34229199, templateRarity: "silver" }, // Czubak
    { id: 34163619, templateRarity: "silver" }, // Zieliński
    { id: 34161548, templateRarity: "bronze" }, // Cash
    { id: 34179917, templateRarity: "bronze" }, // Zalewski
    { id: 34161383, templateRarity: "bronze" }, // Bednarek
    { id: 34193328, templateRarity: "bronze" }, // Kiwior
    { id: 34145396, templateRarity: "bronze" }, // Szczęsny
    { id: 34173679, templateRarity: "bronze" }, // Grabara
];

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

async function fetchPlayer(id) {
    try {
        const { data } = await axios.get(
            `${SPORTSDB_BASE}/lookupplayer.php?id=${id}`,
            { timeout: 8000 },
        );
        return data.players?.[0] || null;
    } catch {
        return null;
    }
}

// ── Pozycja z API -> skrót FIFA ─────────────────────────────────────────────────────────────────

const POS_MAP = {
    Goalkeeper: "GK",
    Defender: "CB",
    "Centre-Back": "CB",
    "Left-Back": "LB",
    "Right-Back": "RB",
    "Defensive Midfield": "CDM",
    "Central Midfield": "CM",
    Midfield: "CM",
    "Attacking Midfield": "CAM",
    "Left Winger": "LW",
    "Left Wing": "LW",
    "Right Winger": "RW",
    "Right Wing": "RW",
    "Centre-Forward": "CF",
    Striker: "ST",
    Forward: "ST",
    Attacker: "ST",
};

const mapPos = (str) => POS_MAP[str] || (str ? str.substring(0, 5) : "CM");

// ── Stats z intLoved ─────────────────────────────────────────────────────────────────

const STAT_PRESETS = {
    special: {
        pace: 95,
        shooting: 95,
        passing: 95,
        dribbling: 95,
        defending: 95,
        physical: 95,
    },
    "gold-rare": {
        pace: 85,
        shooting: 85,
        passing: 85,
        dribbling: 85,
        defending: 85,
        physical: 85,
    },
    gold: {
        pace: 75,
        shooting: 75,
        passing: 75,
        dribbling: 75,
        defending: 75,
        physical: 75,
    },
    silver: {
        pace: 65,
        shooting: 65,
        passing: 65,
        dribbling: 65,
        defending: 65,
        physical: 65,
    },
    bronze: {
        pace: 55,
        shooting: 55,
        passing: 55,
        dribbling: 55,
        defending: 55,
        physical: 55,
    },
};

const OVERALL_PRESET = {
    special: 95,
    "gold-rare": 85,
    gold: 75,
    silver: 65,
    bronze: 55,
};

const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const avatarUrl = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200&bold=true&color=fff`;

// ── SEED ─────────────────────────────────────────────────────────────────

async function seed() {
    await sequelize.query("PRAGMA foreign_keys = OFF");
    await sequelize.sync({ force: true });
    await sequelize.query("PRAGMA foreign_keys = ON");
    console.log("Tabele odtworzone");

    // Użytkownicy
    const adminPassword = await bcrypt.hash("admin123", 10);
    const playerPassword = await bcrypt.hash("player123", 10);
    const player2Password = await bcrypt.hash("player123", 10);

    const [admin, player1, player2] = await User.bulkCreate([
        // Admin
        {
            username: "Admin",
            email: "admin@fifa.pl",
            password: adminPassword,
            role: "admin",
            coins: -1,
        },
        // Player
        {
            username: "Player1",
            email: "player@fifa.pl",
            password: playerPassword,
            role: "player",
            coins: 10000,
        },
        // Player 2 (do testów SBC)
        {
            username: "Player2",
            email: "player2@fifa.pl",
            password: player2Password,
            role: "player",
            coins: 10000,
        },
    ]);
    console.log("Użytkownicy utworzeni");

    // Szablony kart
    const templates = await CardTemplate.bulkCreate([
        {
            name: "Bronze",
            rarity: "bronze",
            bgColor: "#cd7f32",
            borderColor: "#a0522d",
            textColor: "#ffffff",
            accentColor: "#8b4513",
            cssClass: "bronze",
        },
        {
            name: "Silver",
            rarity: "silver",
            bgColor: "#a8a9ad",
            borderColor: "#c0c0c0",
            textColor: "#1a1a1a",
            accentColor: "#808080",
            cssClass: "silver",
        },
        {
            name: "Gold",
            rarity: "gold",
            bgColor: "#c8a84b",
            borderColor: "#f0d060",
            textColor: "#1a1a1a",
            accentColor: "#8b6914",
            cssClass: "gold",
        },
        {
            name: "Gold Rare",
            rarity: "gold-rare",
            bgColor: "#1a1a2e",
            borderColor: "#f0d060",
            textColor: "#f0d060",
            accentColor: "#c8a84b",
            cssClass: "gold-rare",
        },
        {
            name: "Special",
            rarity: "special",
            bgColor: "#0f0f23",
            borderColor: "#9b59b6",
            textColor: "#ffffff",
            accentColor: "#8e44ad",
            cssClass: "special",
        },
    ]);
    const tplMap = {};
    for (const t of templates) tplMap[t.rarity] = t;
    console.log("Szablony kart utworzone (5)");

    // Paczki
    const [starterPack, goldPack, premiumPack] = await Pack.bulkCreate([
        {
            name: "Starter Pack",
            price: 500,
            cardCount: 5,
            description:
                "Idealna paczka na start! Zawiera 5 kart, głównie Bronze i Silver.",
            rarityWeights: JSON.stringify({
                bronze: 60,
                silver: 30,
                gold: 9,
                "gold-rare": 1,
                special: 0,
            }),
        },
        {
            name: "Gold Pack",
            price: 2500,
            cardCount: 8,
            description:
                "Paczka z 8 kartami - gwarantuje przynajmniej 3 złote karty!",
            rarityWeights: JSON.stringify({
                bronze: 10,
                silver: 30,
                gold: 45,
                "gold-rare": 12,
                special: 3,
            }),
        },
        {
            name: "Premium Pack",
            price: 7500,
            cardCount: 12,
            description:
                "Ekskluzywna paczka z 12 kartami - duże szanse na rarytasy!",
            rarityWeights: JSON.stringify({
                bronze: 0,
                silver: 10,
                gold: 40,
                "gold-rare": 38,
                special: 12,
            }),
        },
    ]);
    console.log("Paczki utworzone (3)");

    // 20 kart z TheSportsDB
    console.log("Pobieranie 20 piłkarzy z TheSportsDB API...");
    const apiCards = [];

    for (const { id, templateRarity } of API_PLAYERS) {
        const p = await fetchPlayer(id);
        if (!p) {
            console.warn(`Nie udało się pobrać piłkarza o ID ${id} - pomijam`);
            continue;
        }
        const template = tplMap[templateRarity];
        const preset = STAT_PRESETS[templateRarity];
        const overall = OVERALL_PRESET[templateRarity];
        const position = mapPos(p.strPosition);

        // Losowe drobne odchylenie statystyk dla unikalności
        const stats = Object.fromEntries(
            Object.entries(preset).map(([k, v]) => [
                k,
                Math.min(99, v + rng(-3, 3)),
            ]),
        );

        const card = await Card.create({
            playerName: p.strPlayer,
            position,
            nationality: p.strNationality || null,
            team: p.strTeam || null,
            league: p.strLeague || null,
            age: p.strAge ? parseInt(p.strAge) : null,
            overall,
            stats: JSON.stringify(stats),
            imageUrl: p.strCutout || p.strThumb || avatarUrl(p.strPlayer),
            sportsDbId: p.idPlayer,
            templateId: template.id,
            isActive: true,
        });
        apiCards.push(card);
        console.log(`OK ${p.strPlayer} (${position}, OVR ${overall})`);
    }

    // Kolekcja gracza testowego: 10 kart z API
    const playerStartCards = [...apiCards];
    const starterPlayers = [player1, player2];

    await UserCard.bulkCreate(
        starterPlayers.flatMap((user) =>
            playerStartCards.map((card) => ({
                userId: user.id,
                cardId: card.id,
                obtainedFrom: "seed",
            })),
        ),
    );
    console.log(
        `Gracze "${player1.username}" i "${player2.username}" otrzymali ${playerStartCards.length} startowych kart (z API)`,
    );

    // SBC
    const exampleSBC = await SBC.create({
        name: "Złota Jedenastka",
        description:
            "Zbuduj skład 11 piłkarzy ze średnią ocen minimum 70. Nagroda: Gold Pack!",
        rewardPackId: goldPack.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dni od teraz
        isActive: true,
    });
    await SBCRequirement.bulkCreate([
        {
            sbcId: exampleSBC.id,
            type: "playerCount",
            value: "11",
            label: "11 piłkarzy w składzie",
        },
        {
            sbcId: exampleSBC.id,
            type: "minOverall",
            value: "70",
            label: "Średnia ocen min. 70",
        },
    ]);
    console.log(` SBC "Złota Jedenastka" utworzone`);

    console.log("\n Seed zakończony!");

    await sequelize.close();
}
seed().catch((err) => {
    console.error("X", err);
    process.exit(1);
});
