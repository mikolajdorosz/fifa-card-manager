<template>
    <!--
    views/player/Collection.vue — Kolekcja kart gracza
    
    Galeria kart z:
    - Filtrowaniem wg rzadkości, pozycji, wyszukiwania po imieniu
    - Paginacją
    - Modal szczegółów karty z przyciskiem PDF download
  -->
    <div class="h-full flex flex-col bg-fifa-darker">
        <!-- Filtry -->
        <div class="bg-gray-900 border-b border-gray-700 p-4">
            <div
                class="flex flex-wrap gap-3 items-center max-w-screen-xl mx-auto"
            >
                <h2 class="text-white font-bold font-fifa text-xl mr-2">
                    KOLEKCJA
                </h2>

                <input
                    v-model="filters.search"
                    @input="debouncedLoad"
                    placeholder="Szukaj piłkarza..."
                    class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm w-44"
                />

                <select
                    v-model="filters.rarity"
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

                <select
                    v-model="filters.position"
                    @change="loadCards"
                    class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                >
                    <option value="">Wszystkie pozycje</option>
                    <option v-for="pos in positions" :key="pos" :value="pos">
                        {{ pos }}
                    </option>
                </select>

                <span class="text-gray-400 text-sm ml-auto"
                    >{{ total }} kart</span
                >
            </div>
        </div>

        <!-- Galeria -->
        <div class="flex-1 overflow-y-auto p-4">
            <div v-if="loading" class="text-center py-20 text-gray-500">
                Ładowanie kart...
            </div>

            <div
                v-else-if="userCards.length === 0"
                class="text-center py-20 text-gray-500"
            >
                <div class="text-6xl mb-4">🎴</div>
                <p class="text-xl">Brak kart w kolekcji</p>
                <p class="text-sm mt-2">
                    Kup paczkę w
                    <router-link to="/shop" class="text-fifa-gold underline"
                        >Sklepie</router-link
                    >
                </p>
            </div>

            <div v-else class="mx-20 flex flex-wrap gap-4 justify-center">
                <div
                    v-for="uc in userCards"
                    :key="uc.id"
                    class="relative"
                    @click="openModal(uc)"
                >
                    <PlayerCard :card="uc.card" size="md" />
                    <!-- Badge jeśli w składzie -->
                    <span
                        v-if="uc.isInSquad"
                        class="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded-full"
                        >✓</span
                    >
                    <span
                        v-if="uc.isListed"
                        class="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 rounded-full"
                        >$</span
                    >
                </div>
            </div>

            <!-- Paginacja -->
            <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
                <button
                    v-for="p in totalPages"
                    :key="p"
                    @click="goToPage(p)"
                    class="w-8 h-8 rounded-lg text-sm font-bold transition-colors"
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

        <!-- Modal szczegółów karty -->
        <div
            v-if="selectedCard"
            class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            @click.self="selectedCard = null"
        >
            <div
                class="bg-gray-900 border border-gray-700 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 max-w-lg w-full"
            >
                <!-- ref wskazuje na instancję komponentu PlayerCard, nie na div -->
                <PlayerCard
                    ref="modalCardRef"
                    :card="selectedCard.card"
                    size="lg"
                />

                <div class="flex-1">
                    <h3 class="text-white text-2xl font-bold font-fifa">
                        {{ selectedCard.card.playerName }}
                    </h3>
                    <p class="text-gray-400">
                        {{ selectedCard.card.team }} ·
                        {{ selectedCard.card.league }}
                    </p>
                    <p class="text-gray-400">
                        {{ selectedCard.card.nationality }} ·
                        {{ selectedCard.card.position }}
                    </p>

                    <div class="mt-4 grid grid-cols-2 gap-2">
                        <div
                            v-for="(val, key) in selectedCard.card.stats"
                            :key="key"
                            class="bg-gray-800 rounded-lg p-2 text-center"
                        >
                            <div class="text-white font-bold text-lg">
                                {{ val }}
                            </div>
                            <div class="text-gray-400 text-xs uppercase">
                                {{ statLabels[key] || key }}
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 flex flex-col gap-2">
                        <!-- Wywołuje metodę downloadPdf() wyeksportowaną przez defineExpose w PlayerCard -->
                        <button
                            @click="modalCardRef?.downloadPdf()"
                            class="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                        >
                            📄 Pobierz PDF
                        </button>
                        <button
                            @click="selectedCard = null"
                            class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                        >
                            Zamknij
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import PlayerCard from "../../components/cards/PlayerCard.vue";
import api from "../../api";

const userCards = ref([]);
const total = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const loading = ref(false);
const selectedCard = ref(null);
// ref na instancję komponentu PlayerCard — daje dostęp do downloadPdf() przez defineExpose
const modalCardRef = ref(null);

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
const statLabels = {
    pace: "PAC",
    shooting: "SHO",
    passing: "PAS",
    dribbling: "DRI",
    defending: "DEF",
    physical: "PHY",
};

const filters = reactive({ search: "", rarity: "", position: "" });

let debounceTimer;
const debouncedLoad = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadCards, 300);
};

onMounted(loadCards);

async function loadCards() {
    loading.value = true;
    try {
        const params = { page: currentPage.value, limit: 20, ...filters };
        const { data } = await api.get("/collection", { params });
        userCards.value = data.userCards;
        total.value = data.total;
        totalPages.value = data.totalPages;
    } finally {
        loading.value = false;
    }
}

function goToPage(p) {
    currentPage.value = p;
    loadCards();
}

function openModal(uc) {
    selectedCard.value = uc;
}
</script>
