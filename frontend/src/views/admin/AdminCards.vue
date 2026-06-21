<template>
    <!--
    views/admin/AdminCards.vue — Zarządzanie kartami piłkarzy
    
    Admin może:
    1. Wyszukać piłkarza w TheSportsDB API i stworzyć z niego kartę
    2. Stworzyć customowego piłkarza z własnym zdjęciem z dysku
    3. Przeglądać i edytować istniejące karty (nazwa, pozycja, drużyna,
       narodowość, liga, overall, szablon, statystyki — zdjęcie zostaje
       bez zmian, bo pochodzi z API lub uploadu i nie jest tu edytowalne)
    4. Usuwać karty
    
    Każda karta musi mieć przypisany szablon (CardTemplate).
  -->
    <div class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-white font-bold font-fifa text-2xl">
                KARTY PIŁKARZY
            </h2>
            <div class="flex gap-2">
                <button
                    @click="openModal('api')"
                    class="bg-blue-700 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                    + Z API (TheSportsDB)
                </button>
                <button
                    @click="openModal('custom')"
                    class="bg-purple-700 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                    + Karta Custom
                </button>
            </div>
        </div>

        <!-- Filtry -->
        <div class="flex flex-wrap gap-3 mb-5">
            <input
                v-model="search"
                @input="debouncedLoad"
                placeholder="Szukaj po nazwie..."
                class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm w-48"
            />
            <select
                v-model="filterRarity"
                @change="loadCards"
                class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
            >
                <option value="">Wszystkie rzadkości</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="gold-rare">Gold Rare</option>
                <option value="special">Special</option>
            </select>
            <span class="text-gray-400 text-sm self-center ml-auto"
                >{{ totalCards }} kart</span
            >
        </div>

        <!-- Tabela kart -->
        <div
            class="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden"
        >
            <div v-if="loading" class="text-center py-16 text-gray-500">
                Ładowanie...
            </div>

            <div
                v-else-if="cards.length === 0"
                class="text-center py-16 text-gray-500"
            >
                Brak kart. Dodaj pierwszą kartę przyciskiem powyżej.
            </div>

            <table v-else class="w-full text-sm">
                <thead class="bg-gray-800 text-gray-400 uppercase text-xs">
                    <tr>
                        <th class="px-4 py-3 text-left">Karta</th>
                        <th class="px-4 py-3 text-left">Piłkarz</th>
                        <th class="px-4 py-3 text-left hidden md:table-cell">
                            Drużyna / Liga
                        </th>
                        <th class="px-4 py-3 text-left hidden lg:table-cell">
                            Szablon
                        </th>
                        <th class="px-4 py-3 text-center">OVR</th>
                        <th class="px-4 py-3 text-center">Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="card in cards"
                        :key="card.id"
                        class="border-t border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                        <td class="px-4 py-3">
                            <PlayerCard :card="card" size="sm" />
                        </td>
                        <td class="px-4 py-3">
                            <p class="text-white font-bold">
                                {{ card.playerName }}
                            </p>
                            <p class="text-gray-400 text-xs">
                                {{ card.position }} · {{ card.nationality }}
                            </p>
                            <span
                                v-if="card.sportsDbId"
                                class="text-blue-400 text-xs"
                                >API</span
                            >
                            <span v-else class="text-purple-400 text-xs"
                                >Custom</span
                            >
                        </td>
                        <td class="px-4 py-3 hidden md:table-cell">
                            <p class="text-gray-300">{{ card.team }}</p>
                            <p class="text-gray-500 text-xs">
                                {{ card.league }}
                            </p>
                        </td>
                        <td class="px-4 py-3 hidden lg:table-cell">
                            <span
                                class="px-2 py-1 rounded-full text-xs font-bold"
                                :style="{
                                    background: card.template?.bgColor,
                                    color: card.template?.textColor,
                                }"
                            >
                                {{ card.template?.name }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="text-white font-bold text-lg">{{
                                card.overall
                            }}</span>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <div class="flex gap-1 justify-center">
                                <button
                                    @click="editCard(card)"
                                    class="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                                >
                                    Edytuj
                                </button>
                                <button
                                    @click="deleteCard(card)"
                                    class="bg-red-900 hover:bg-red-800 text-red-300 px-2 py-1 rounded text-xs transition-colors"
                                >
                                    Usuń
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Paginacja -->
            <div
                v-if="totalPages > 1"
                class="flex justify-center gap-2 p-4 border-t border-gray-800"
            >
                <button
                    v-for="p in totalPages"
                    :key="p"
                    @click="goToPage(p)"
                    class="w-8 h-8 rounded text-xs font-bold"
                    :class="
                        p === currentPage
                            ? 'bg-fifa-gold text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    "
                >
                    {{ p }}
                </button>
            </div>
        </div>

        <!-- ── MODAL: Z API ──────────────────────────────────────────────────── -->
        <div
            v-if="modal === 'api'"
            class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            @click.self="closeModal"
        >
            <div
                class="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <h3 class="text-white font-bold font-fifa text-xl mb-4">
                    DODAJ KARTĘ Z TheSportsDB API
                </h3>

                <!-- Wyszukiwarka -->
                <div class="flex gap-2 mb-4">
                    <input
                        v-model="apiSearch"
                        @keyup.enter="searchPlayers"
                        placeholder="Wpisz nazwisko piłkarza (np. Messi)..."
                        class="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                        @click="searchPlayers"
                        :disabled="searching"
                        class="bg-blue-700 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        {{ searching ? "..." : "Szukaj" }}
                    </button>
                </div>

                <!-- Wyniki wyszukiwania -->
                <div
                    v-if="apiResults.length"
                    class="space-y-2 mb-5 max-h-60 overflow-y-auto"
                >
                    <div
                        v-for="player in apiResults"
                        :key="player.idPlayer"
                        @click="selectApiPlayer(player)"
                        class="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors"
                        :class="
                            selectedApiPlayer?.idPlayer === player.idPlayer
                                ? 'bg-gray-700 border border-fifa-gold'
                                : 'bg-gray-800/50'
                        "
                    >
                        <img
                            v-if="player.strThumb"
                            :src="player.strThumb"
                            class="w-10 h-10 rounded-full object-cover"
                        />
                        <div
                            v-else
                            class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold"
                        >
                            {{ player.strPlayer?.charAt(0) }}
                        </div>
                        <div>
                            <p class="text-white font-bold text-sm">
                                {{ player.strPlayer }}
                            </p>
                            <p class="text-gray-400 text-xs">
                                {{ player.strTeam }} ·
                                {{ player.strPosition }} ·
                                {{ player.strNationality }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Formularz tworzenia karty po wybraniu piłkarza -->
                <div
                    v-if="selectedApiPlayer"
                    class="border-t border-gray-700 pt-4 space-y-4"
                >
                    <div
                        class="flex items-center gap-4 p-3 bg-gray-800 rounded-xl"
                    >
                        <img
                            v-if="
                                selectedApiPlayer.strCutout ||
                                selectedApiPlayer.strThumb
                            "
                            :src="
                                selectedApiPlayer.strCutout ||
                                selectedApiPlayer.strThumb
                            "
                            class="w-16 h-16 object-contain"
                        />
                        <div>
                            <p class="text-white font-bold">
                                {{ selectedApiPlayer.strPlayer }}
                            </p>
                            <p class="text-gray-400 text-sm">
                                {{ selectedApiPlayer.strTeam }} ·
                                {{ selectedApiPlayer.strNationality }}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Szablon karty *</label
                            >
                            <select
                                v-model="apiForm.templateId"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">— Wybierz szablon —</option>
                                <option
                                    v-for="t in templates"
                                    :key="t.id"
                                    :value="t.id"
                                >
                                    {{ t.name }} ({{ t.rarity }})
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Overall (0–99)</label
                            >
                            <input
                                v-model.number="apiForm.overall"
                                type="number"
                                min="0"
                                max="99"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <!-- Statystyki -->
                    <div>
                        <p class="text-gray-400 text-xs mb-2">Statystyki</p>
                        <div class="grid grid-cols-3 gap-2">
                            <div v-for="stat in statKeys" :key="stat">
                                <label class="text-gray-500 text-xs">{{
                                    statLabels[stat]
                                }}</label>
                                <input
                                    v-model.number="apiForm.stats[stat]"
                                    type="number"
                                    min="0"
                                    max="99"
                                    class="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Podgląd -->
                    <div class="flex justify-center">
                        <PlayerCard
                            v-if="apiForm.templateId"
                            :card="previewCard"
                            size="lg"
                        />
                    </div>

                    <button
                        @click="createFromApi"
                        :disabled="!apiForm.templateId || creating"
                        class="w-full bg-fifa-gold hover:bg-fifa-gold-light disabled:opacity-40 text-black font-bold py-3 rounded-xl font-fifa text-lg transition-colors"
                    >
                        {{ creating ? "Tworzenie..." : "UTWÓRZ KARTĘ" }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ── MODAL: CUSTOM ─────────────────────────────────────────────────── -->
        <div
            v-if="modal === 'custom'"
            class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            @click.self="closeModal"
        >
            <div
                class="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
                <h3 class="text-white font-bold font-fifa text-xl mb-4">
                    UTWÓRZ CUSTOMOWĄ KARTĘ
                </h3>

                <div class="space-y-4">
                    <!-- Upload zdjęcia -->
                    <div>
                        <label class="text-gray-400 text-xs mb-1 block"
                            >Zdjęcie piłkarza *</label
                        >
                        <input
                            type="file"
                            accept="image/*"
                            @change="onFileChange"
                            class="text-gray-400 text-sm"
                        />
                        <div v-if="customPreviewUrl" class="mt-2">
                            <img
                                :src="customPreviewUrl"
                                class="h-24 object-contain rounded-lg"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Imię i nazwisko *</label
                            >
                            <input
                                v-model="customForm.playerName"
                                placeholder="np. Jan Kowalski"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Pozycja *</label
                            >
                            <select
                                v-model="customForm.position"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">— Pozycja —</option>
                                <option
                                    v-for="pos in positions"
                                    :key="pos"
                                    :value="pos"
                                >
                                    {{ pos }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Drużyna</label
                            >
                            <input
                                v-model="customForm.team"
                                placeholder="np. FC Barcelona"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Narodowość</label
                            >
                            <input
                                v-model="customForm.nationality"
                                placeholder="np. Polish"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Liga</label
                            >
                            <input
                                v-model="customForm.league"
                                placeholder="np. Ekstraklasa"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Overall (0–99) *</label
                            >
                            <input
                                v-model.number="customForm.overall"
                                type="number"
                                min="0"
                                max="99"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Szablon karty *</label
                            >
                            <select
                                v-model="customForm.templateId"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">— Szablon —</option>
                                <option
                                    v-for="t in templates"
                                    :key="t.id"
                                    :value="t.id"
                                >
                                    {{ t.name }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <!-- Statystyki -->
                    <div>
                        <p class="text-gray-400 text-xs mb-2">Statystyki</p>
                        <div class="grid grid-cols-3 gap-2">
                            <div v-for="stat in statKeys" :key="stat">
                                <label class="text-gray-500 text-xs">{{
                                    statLabels[stat]
                                }}</label>
                                <input
                                    v-model.number="customForm.stats[stat]"
                                    type="number"
                                    min="0"
                                    max="99"
                                    class="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        @click="createCustom"
                        :disabled="
                            !customForm.playerName ||
                            !customForm.position ||
                            !customForm.templateId ||
                            creating
                        "
                        class="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl font-fifa text-lg transition-colors"
                    >
                        {{ creating ? "Tworzenie..." : "UTWÓRZ KARTĘ" }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ── MODAL: EDYTUJ KARTĘ ───────────────────────────────────────────── -->
        <div
            v-if="modal === 'edit'"
            class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            @click.self="closeModal"
        >
            <div
                class="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
                <h3 class="text-white font-bold font-fifa text-xl mb-4">
                    EDYTUJ KARTĘ — {{ editForm.playerName }}
                </h3>

                <div class="space-y-4">
                    <!-- Podgląd aktualnego zdjęcia (niezmienialne dla kart z API) -->
                    <div
                        v-if="editForm.imageUrl"
                        class="flex items-center gap-3 p-3 bg-gray-800 rounded-xl"
                    >
                        <img
                            :src="editForm.imageUrl"
                            class="w-14 h-14 object-contain rounded"
                        />
                        <p class="text-gray-400 text-xs">
                            Zdjęcie pochodzi z
                            {{ editingCard?.sportsDbId ? "TheSportsDB" : "uploadu" }}
                            i nie jest edytowalne z tego poziomu.
                        </p>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Imię i nazwisko *</label
                            >
                            <input
                                v-model="editForm.playerName"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Pozycja *</label
                            >
                            <select
                                v-model="editForm.position"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            >
                                <option
                                    v-for="pos in positions"
                                    :key="pos"
                                    :value="pos"
                                >
                                    {{ pos }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Drużyna</label
                            >
                            <input
                                v-model="editForm.team"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Narodowość</label
                            >
                            <input
                                v-model="editForm.nationality"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Liga</label
                            >
                            <input
                                v-model="editForm.league"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Overall (0–99) *</label
                            >
                            <input
                                v-model.number="editForm.overall"
                                type="number"
                                min="0"
                                max="99"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div class="col-span-2">
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Szablon karty *</label
                            >
                            <select
                                v-model="editForm.templateId"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            >
                                <option
                                    v-for="t in templates"
                                    :key="t.id"
                                    :value="t.id"
                                >
                                    {{ t.name }} ({{ t.rarity }})
                                </option>
                            </select>
                        </div>
                    </div>

                    <!-- Statystyki -->
                    <div>
                        <p class="text-gray-400 text-xs mb-2">Statystyki</p>
                        <div class="grid grid-cols-3 gap-2">
                            <div v-for="stat in statKeys" :key="stat">
                                <label class="text-gray-500 text-xs">{{
                                    statLabels[stat]
                                }}</label>
                                <input
                                    v-model.number="editForm.stats[stat]"
                                    type="number"
                                    min="0"
                                    max="99"
                                    class="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Podgląd na żywo -->
                    <div class="flex justify-center">
                        <PlayerCard :card="editPreviewCard" size="lg" />
                    </div>

                    <div class="flex gap-3 pt-2">
                        <button
                            @click="saveEditedCard"
                            :disabled="
                                !editForm.playerName ||
                                !editForm.position ||
                                !editForm.templateId ||
                                savingEdit
                            "
                            class="flex-1 bg-fifa-gold hover:bg-fifa-gold-light disabled:opacity-40 text-black font-bold py-3 rounded-xl font-fifa transition-colors"
                        >
                            {{ savingEdit ? "Zapisywanie..." : "ZAPISZ ZMIANY" }}
                        </button>
                        <button
                            @click="closeModal"
                            class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors"
                        >
                            Anuluj
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import PlayerCard from "../../components/cards/PlayerCard.vue";
import api from "../../api";

const cards = ref([]);
const templates = ref([]);
const loading = ref(false);
const totalCards = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const search = ref("");
const filterRarity = ref("");
const modal = ref(null);
const creating = ref(false);

// API search
const apiSearch = ref("");
const apiResults = ref([]);
const selectedApiPlayer = ref(null);
const searching = ref(false);

// Forms
const statKeys = [
    "pace",
    "shooting",
    "passing",
    "dribbling",
    "defending",
    "physical",
];
const statLabels = {
    pace: "PAC",
    shooting: "SHO",
    passing: "PAS",
    dribbling: "DRI",
    defending: "DEF",
    physical: "PHY",
};
const positions = [
    "GK",
    "LB",
    "CB",
    "RB",
    "CDM",
    "CM",
    "CAM",
    "LW",
    "RW",
    "ST",
    "CF",
];

const defaultStats = () => ({
    pace: 75,
    shooting: 75,
    passing: 75,
    dribbling: 75,
    defending: 50,
    physical: 70,
});

const apiForm = ref({ templateId: "", overall: 80, stats: defaultStats() });
const customForm = ref({
    playerName: "",
    position: "",
    team: "",
    nationality: "",
    league: "",
    overall: 75,
    templateId: "",
    stats: defaultStats(),
});
const customFile = ref(null);
const customPreviewUrl = ref(null);

const previewCard = computed(() => {
    if (!selectedApiPlayer.value) return null;
    const t = templates.value.find((t) => t.id == apiForm.value.templateId);
    return {
        playerName: selectedApiPlayer.value.strPlayer,
        position: selectedApiPlayer.value.strPosition?.substring(0, 5) || "ST",
        overall: apiForm.value.overall,
        stats: apiForm.value.stats,
        imageUrl:
            selectedApiPlayer.value.strCutout ||
            selectedApiPlayer.value.strThumb,
        template: t || null,
    };
});

// ── Edycja karty ──────────────────────────────────────────────────────────
const editingCard = ref(null);
const savingEdit = ref(false);
const editForm = ref({
    playerName: "",
    position: "",
    team: "",
    nationality: "",
    league: "",
    overall: 75,
    templateId: "",
    stats: defaultStats(),
    imageUrl: "",
});

const editPreviewCard = computed(() => {
    const t = templates.value.find((t) => t.id == editForm.value.templateId);
    return {
        playerName: editForm.value.playerName,
        position: editForm.value.position,
        overall: editForm.value.overall,
        stats: editForm.value.stats,
        imageUrl: editForm.value.imageUrl,
        template: t || null,
    };
});

let debounceTimer;
const debouncedLoad = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadCards, 300);
};

onMounted(async () => {
    await Promise.all([loadCards(), loadTemplates()]);
});

async function loadCards() {
    loading.value = true;
    try {
        const { data } = await api.get("/cards", {
            params: {
                page: currentPage.value,
                limit: 15,
                search: search.value,
                rarity: filterRarity.value,
            },
        });
        cards.value = data.cards;
        totalCards.value = data.total;
        totalPages.value = data.totalPages;
    } finally {
        loading.value = false;
    }
}

async function loadTemplates() {
    const { data } = await api.get("/templates");
    templates.value = data;
}

function goToPage(p) {
    currentPage.value = p;
    loadCards();
}

function openModal(type) {
    modal.value = type;
    apiResults.value = [];
    selectedApiPlayer.value = null;
    apiSearch.value = "";
    apiForm.value = { templateId: "", overall: 80, stats: defaultStats() };
    customForm.value = {
        playerName: "",
        position: "",
        team: "",
        nationality: "",
        league: "",
        overall: 75,
        templateId: "",
        stats: defaultStats(),
    };
    customFile.value = null;
    customPreviewUrl.value = null;
}

function closeModal() {
    modal.value = null;
    editingCard.value = null;
}

async function searchPlayers() {
    if (!apiSearch.value.trim()) return;
    searching.value = true;
    try {
        const { data } = await api.get(
            `/cards/search-player?name=${encodeURIComponent(apiSearch.value)}`,
        );
        apiResults.value = data;
    } catch {
        apiResults.value = [];
    } finally {
        searching.value = false;
    }
}

function selectApiPlayer(player) {
    selectedApiPlayer.value = player;
    // Ustaw domyślne overall na podstawie popularności
    const loved = parseInt(player.intLoved) || 75;
    apiForm.value.overall = Math.min(99, Math.max(60, loved));
}

async function createFromApi() {
    creating.value = true;
    try {
        await api.post("/cards", {
            sportsDbId: selectedApiPlayer.value.idPlayer,
            templateId: apiForm.value.templateId,
            overall: apiForm.value.overall,
            stats: apiForm.value.stats,
        });
        closeModal();
        await loadCards();
        alert("Karta utworzona!");
    } catch (err) {
        alert(err.response?.data?.error || "Błąd tworzenia karty");
    } finally {
        creating.value = false;
    }
}

function onFileChange(e) {
    customFile.value = e.target.files[0];
    if (customFile.value) {
        customPreviewUrl.value = URL.createObjectURL(customFile.value);
    }
}

async function createCustom() {
    creating.value = true;
    try {
        const formData = new FormData();
        Object.entries(customForm.value).forEach(([k, v]) => {
            if (k === "stats") formData.append(k, JSON.stringify(v));
            else formData.append(k, v);
        });
        if (customFile.value) formData.append("image", customFile.value);

        await api.post("/cards/custom", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        closeModal();
        await loadCards();
        alert("Karta custom utworzona!");
    } catch (err) {
        alert(err.response?.data?.error || "Błąd");
    } finally {
        creating.value = false;
    }
}

async function deleteCard(card) {
    if (!confirm(`Usunąć kartę "${card.playerName}"?`)) return;
    await api.delete(`/cards/${card.id}`);
    await loadCards();
}

function editCard(card) {
    editingCard.value = card;
    editForm.value = {
        playerName: card.playerName,
        position: card.position,
        team: card.team || "",
        nationality: card.nationality || "",
        league: card.league || "",
        overall: card.overall,
        templateId: card.templateId,
        stats: { ...card.stats },
        imageUrl: card.imageUrl || "",
    };
    modal.value = "edit";
}

async function saveEditedCard() {
    if (!editingCard.value) return;
    savingEdit.value = true;
    try {
        await api.put(`/cards/${editingCard.value.id}`, {
            playerName: editForm.value.playerName,
            position: editForm.value.position,
            team: editForm.value.team || null,
            nationality: editForm.value.nationality || null,
            league: editForm.value.league || null,
            overall: editForm.value.overall,
            templateId: editForm.value.templateId,
            stats: editForm.value.stats,
        });
        closeModal();
        await loadCards();
        alert("Karta zaktualizowana!");
    } catch (err) {
        alert(err.response?.data?.error || "Błąd zapisu zmian");
    } finally {
        savingEdit.value = false;
    }
}
</script>
