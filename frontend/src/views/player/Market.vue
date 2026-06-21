<template>
    <!--
    views/player/Market.vue — Rynek transferowy
    
    Dwie zakładki:
    1. "Przeglądaj" — wszystkie aktywne oferty innych graczy (z filtrowaniem, kupno)
    2. "Moje oferty" — karty wystawione przez aktualnego gracza (możliwość wycofania)
       + panel wystawiania nowej karty
  -->
    <div class="min-h-full bg-fifa-darker p-4">
        <div class="max-w-screen-xl mx-auto">
            <div class="flex items-center justify-between mb-6">
                <h2
                    class="text-white font-bold font-fifa text-3xl gradient-gold"
                >
                    RYNEK TRANSFEROWY
                </h2>
                <p class="text-fifa-gold font-bold">
                    {{ auth.coins.toLocaleString() }} 🪙
                </p>
            </div>

            <!-- Zakładki -->
            <div class="flex gap-2 mb-6">
                <button
                    v-for="tab in ['Przeglądaj', 'Moje oferty', 'Wystaw kartę']"
                    :key="tab"
                    @click="activeTab = tab"
                    class="px-5 py-2 rounded-lg font-bold font-fifa transition-colors"
                    :class="
                        activeTab === tab
                            ? 'bg-fifa-gold text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    "
                >
                    {{ tab }}
                </button>
            </div>

            <!-- ── PRZEGLĄDAJ ──────────────────────────────────────────────────── -->
            <div v-if="activeTab === 'Przeglądaj'">
                <!-- Filtry -->
                <div class="flex flex-wrap gap-3 mb-5">
                    <input
                        v-model="filters.search"
                        @input="debouncedLoad"
                        placeholder="Szukaj piłkarza..."
                        class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm w-44"
                    />
                    <input
                        v-model.number="filters.minPrice"
                        @change="loadListings"
                        placeholder="Min. cena"
                        type="number"
                        class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm w-32"
                    />
                    <input
                        v-model.number="filters.maxPrice"
                        @change="loadListings"
                        placeholder="Max. cena"
                        type="number"
                        class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm w-32"
                    />
                </div>

                <div
                    v-if="loadingListings"
                    class="text-center py-20 text-gray-500"
                >
                    Ładowanie ofert...
                </div>

                <div
                    v-else-if="listings.length === 0"
                    class="text-center py-20 text-gray-500"
                >
                    <div class="text-6xl mb-4">💰</div>
                    <p>Brak aktywnych ofert</p>
                </div>

                <div
                    v-else
                    class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                >
                    <div
                        v-for="listing in listings"
                        :key="listing.id"
                        class="bg-gray-900 border border-gray-700 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-gray-500 transition-colors"
                    >
                        <PlayerCard :card="listing.userCard.card" size="sm" />
                        <p
                            class="text-white text-xs font-bold text-center truncate w-full"
                        >
                            {{ listing.userCard.card.playerName }}
                        </p>
                        <p class="text-gray-400 text-xs">
                            {{ listing.seller?.username }}
                        </p>
                        <p class="text-fifa-gold font-bold text-sm">
                            {{ listing.price.toLocaleString() }} 🪙
                        </p>
                        <button
                            @click="buyCard(listing)"
                            :disabled="
                                auth.coins < listing.price ||
                                listing.sellerId === auth.user?.id ||
                                buying === listing.id
                            "
                            class="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
                        >
                            {{
                                listing.sellerId === auth.user?.id
                                    ? "Twoja"
                                    : buying === listing.id
                                      ? "..."
                                      : "KUP"
                            }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- ── MOJE OFERTY ─────────────────────────────────────────────────── -->
            <div v-else-if="activeTab === 'Moje oferty'">
                <div
                    v-if="loadingMyListings"
                    class="text-center py-20 text-gray-500"
                >
                    Ładowanie ofert...
                </div>
                <div
                    v-else-if="myListings.length === 0"
                    class="text-center py-20 text-gray-500"
                >
                    Nie masz aktywnych ofert
                </div>
                <div
                    v-else
                    class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                    <div
                        v-for="listing in myListings"
                        :key="listing.id"
                        class="bg-gray-900 border border-gray-700 rounded-xl p-3 flex flex-col items-center gap-2"
                    >
                        <PlayerCard :card="listing.userCard.card" size="sm" />
                        <p
                            class="text-white text-xs font-bold text-center truncate w-full"
                        >
                            {{ listing.userCard.card.playerName }}
                        </p>
                        <p class="text-fifa-gold font-bold text-sm">
                            {{ listing.price.toLocaleString() }} 🪙
                        </p>
                        <button
                            @click="cancelListing(listing)"
                            :disabled="cancelling === listing.id"
                            class="w-full bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
                        >
                            {{ cancelling === listing.id ? "..." : "WYCOFAJ" }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- ── WYSTAW KARTĘ ─────────────────────────────────────────────────── -->
            <div v-else>
                <div class="max-w-lg">
                    <p class="text-gray-400 text-sm mb-5">
                        Wybierz kartę z kolekcji i ustaw cenę sprzedaży.
                    </p>

                    <div class="flex flex-col gap-4">
                        <select
                            v-model="listForm.userCardId"
                            class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-3"
                        >
                            <option value="">— Wybierz kartę —</option>
                            <option
                                v-for="uc in unlistedCards"
                                :key="uc.id"
                                :value="uc.id"
                            >
                                {{ uc.card.playerName }} ({{
                                    uc.card.position
                                }}
                                · {{ uc.card.overall }} OVR ·
                                {{ uc.card.template?.name }})
                            </option>
                        </select>

                        <input
                            v-model.number="listForm.price"
                            type="number"
                            min="1"
                            placeholder="Cena w monetach"
                            class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-3"
                        />

                        <button
                            @click="listCard"
                            :disabled="
                                !listForm.userCardId ||
                                !listForm.price ||
                                listing_
                            "
                            class="bg-fifa-gold hover:bg-fifa-gold-light disabled:opacity-40 text-black font-bold py-3 rounded-xl font-fifa text-lg transition-colors"
                        >
                            {{
                                listing_ ? "Wystawianie..." : "WYSTAW NA RYNEK"
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import PlayerCard from "../../components/cards/PlayerCard.vue";
import { useAuthStore } from "../../store/auth";
import api from "../../api";

const auth = useAuthStore();
const activeTab = ref("Przeglądaj");
const listings = ref([]);
const myListings = ref([]);
const myCards = ref([]);
const loadingListings = ref(false);
const loadingMyListings = ref(false);
const buying = ref(null);
const cancelling = ref(null);
const listing_ = ref(false);
const filters = ref({ search: "", minPrice: "", maxPrice: "" });
const listForm = ref({ userCardId: "", price: "" });

// Autopull co 5s — rynek aktualizuje się automatycznie dla wszystkich graczy,
// żeby karta kupiona/wycofana przez kogoś innego znikała szybko z widoku
// "Przeglądaj" zamiast wisieć jako wciąż dostępna do czasu odświeżenia strony.
const POLL_MS = 5000;
let pollInterval = null;

const unlistedCards = computed(() =>
    myCards.value.filter((uc) => !uc.isListed && !uc.isInSquad),
);

let debounceTimer;
const debouncedLoad = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadListings, 300);
};

onMounted(async () => {
    await Promise.all([loadListings(), loadMyListings(), loadMyCards()]);
    pollInterval = setInterval(refreshCurrentTab, POLL_MS);
    // Odśwież natychmiast, gdy karta odzyskuje fokus (np. powrót z innej zakładki),
    // żeby nie czekać na kolejny tick pollingu po dłuższej nieaktywności.
    document.addEventListener("visibilitychange", onVisibilityChange);
});

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
    document.removeEventListener("visibilitychange", onVisibilityChange);
});

async function refreshCurrentTab() {
    switch (activeTab.value) {
        case "Przeglądaj":
            await loadListings();
            break;

        case "Moje oferty":
            await loadMyListings();
            break;

        case "Wystaw kartę":
            await loadMyCards();
            break;
    }
}

function onVisibilityChange() {
    if (document.visibilityState === "visible") {
        refreshCurrentTab();
    }
}

watch(activeTab, (tab) => {
    if (tab === "Moje oferty") loadMyListings();
    if (tab === "Wystaw kartę") loadMyCards();
    if (tab === "Przeglądaj") loadListings();
});

async function loadListings() {
    loadingListings.value = true;
    try {
        const { data } = await api.get("/market", { params: filters.value });
        listings.value = data.listings;
    } finally {
        loadingListings.value = false;
    }
}

async function loadMyListings() {
    loadingMyListings.value = true;
    try {
        const { data } = await api.get("/market", {
            params: { sellerId: auth.user?.id, limit: 50 },
        });
        // Filtrujemy po sellerId po stronie front (API zwraca wszystkie)
        myListings.value = data.listings.filter(
            (l) => l.sellerId === auth.user?.id,
        );
    } finally {
        loadingMyListings.value = false;
    }
}

async function loadMyCards() {
    const { data } = await api.get("/collection?limit=200");
    myCards.value = data.userCards;
}

async function buyCard(listing) {
    buying.value = listing.id;
    try {
        await api.post(`/market/${listing.id}/buy`);
        auth.updateCoins(-listing.price);
        // Usuń ofertę natychmiast z lokalnego stanu (optimistic update) —
        // karta jest już sprzedana, więc nie powinna dłużej widnieć jako
        // dostępna, nawet na ułamek sekundy przed odświeżeniem z serwera.
        listings.value = listings.value.filter((l) => l.id !== listing.id);
        alert("Karta zakupiona!");
        // Pełne odświeżenie w tle dla pewności spójności z serwerem
        await loadListings();
    } catch (err) {
        alert(err.response?.data?.error || "Błąd zakupu");
        await loadListings();
    } finally {
        buying.value = null;
    }
}

async function cancelListing(listing) {
    cancelling.value = listing.id;
    try {
        await api.delete(`/market/${listing.id}`);
        // Usuń natychmiast z obu list lokalnie — wycofana oferta nie może
        // dalej być widoczna jako aktywna u żadnego gracza.
        myListings.value = myListings.value.filter((l) => l.id !== listing.id);
        listings.value = listings.value.filter((l) => l.id !== listing.id);
        await Promise.all([loadMyListings(), loadListings()]);
    } catch (err) {
        alert(err.response?.data?.error || "Błąd");
    } finally {
        cancelling.value = null;
    }
}

async function listCard() {
    listing_.value = true;
    try {
        await api.post("/market", {
            userCardId: listForm.value.userCardId,
            price: listForm.value.price,
        });
        listForm.value = { userCardId: "", price: "" };
        // Odśwież wszystkie listy jednocześnie i przejdź do "Moje oferty"
        await Promise.all([loadMyCards(), loadMyListings(), loadListings()]);
        activeTab.value = "Moje oferty";
        alert("Karta wystawiona na rynek!");
    } catch (err) {
        alert(err.response?.data?.error || "Błąd");
    } finally {
        listing_.value = false;
    }
}
</script>
