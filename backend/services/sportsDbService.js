/**
 * services/sportsDbService.js — Serwis do komunikacji z TheSportsDB API
 *
 * Kapsułkuje wszystkie zapytania do zewnętrznego API.
 * Używany wyłącznie przez adminów podczas tworzenia kart.
 *
 * Dokumentacja endpointów: docs/api.md
 * Base URL: https://www.thesportsdb.com/api/v1/json/3/
 */

const axios = require('axios');

const BASE_URL = process.env.SPORTSDB_BASE_URL || 'https://www.thesportsdb.com/api/v1/json/3';
const API_KEY = process.env.SPORTSDB_API_KEY || '3';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

const sportsDbService = {
  /**
   * Wyszukaj piłkarza po imieniu/nazwisku
   * GET /searchplayers.php?p={name}
   * @returns {Array} Lista piłkarzy pasujących do zapytania
   */
  async searchPlayers(name) {
    const { data } = await client.get(`/searchplayers.php`, {
      params: { p: name },
    });
    return data.player || [];
  },

  /**
   * Pobierz szczegóły piłkarza po ID z TheSportsDB
   * GET /lookupplayer.php?id={playerId}
   * @returns {Object|null} Dane piłkarza lub null
   */
  async getPlayerById(playerId) {
    const { data } = await client.get(`/lookupplayer.php`, {
      params: { id: playerId },
    });
    return data.players?.[0] || null;
  },

  /**
   * Mapuj dane z TheSportsDB na format naszej karty
   * Konwertuje API response na obiekt gotowy do zapisu w bazie
   */
  mapPlayerToCard(apiPlayer) {
    // Szacowanie statystyk na podstawie danych dostępnych w API
    // TheSportsDB nie daje statystyk w stylu FIFA, więc szacujemy
    const loved = parseInt(apiPlayer.intLoved) || 70;
    const baseStats = {
      pace: Math.min(99, Math.max(40, loved + Math.floor(Math.random() * 10 - 5))),
      shooting: Math.min(99, Math.max(40, loved + Math.floor(Math.random() * 10 - 5))),
      passing: Math.min(99, Math.max(40, loved + Math.floor(Math.random() * 10 - 5))),
      dribbling: Math.min(99, Math.max(40, loved + Math.floor(Math.random() * 10 - 5))),
      defending: Math.min(99, Math.max(20, loved - 20 + Math.floor(Math.random() * 15))),
      physical: Math.min(99, Math.max(40, loved + Math.floor(Math.random() * 10 - 5))),
    };

    const overall = Math.round(
      Object.values(baseStats).reduce((a, b) => a + b, 0) / 6
    );

    // Mapuj pozycję z API na skrót pozycji FIFA
    const positionMap = {
      'Goalkeeper': 'GK',
      'Defender': 'CB',
      'Midfielder': 'CM',
      'Forward': 'ST',
      'Winger': 'LW',
      'Striker': 'ST',
      'Left Back': 'LB',
      'Right Back': 'RB',
      'Centre-Back': 'CB',
      'Attacking Midfield': 'CAM',
      'Defensive Midfield': 'CDM',
    };

    return {
      playerName: apiPlayer.strPlayer,
      position: positionMap[apiPlayer.strPosition] || apiPlayer.strPosition?.substring(0, 5) || 'CM',
      nationality: apiPlayer.strNationality,
      team: apiPlayer.strTeam,
      league: apiPlayer.strLeague || null,
      age: apiPlayer.strAge ? parseInt(apiPlayer.strAge) : null,
      overall,
      stats: baseStats,
      imageUrl: apiPlayer.strCutout || apiPlayer.strThumb || null,
      sportsDbId: apiPlayer.idPlayer,
    };
  },
};

module.exports = sportsDbService;
