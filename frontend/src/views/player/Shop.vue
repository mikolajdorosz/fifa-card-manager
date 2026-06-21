<template>
    <!--
    views/player/Shop.vue — Sklep z paczkami
    
    Gracz może:
    - Przeglądać dostępne paczki z cenami i opisami
    - Kupić paczkę (odejmuje monety, zwraca wylosowane karty)
    - Zobaczyć animację otwierania paczki (karty pojawiają się jedna po jednej)
    - Wszystkie karty mieszczą się na ekranie — responsywny grid
  -->
    <div class="min-h-full bg-fifa-darker">
        <!-- Sklep — lista paczek -->
        <div v-if="!openingResult" class="max-w-screen-xl mx-auto p-6">
            <h2
                class="text-white font-bold font-fifa text-3xl mb-2 gradient-gold"
            >
                SKLEP
            </h2>
            <p class="text-gray-400 mb-8">
                Twoje monety:
                <span class="text-fifa-gold font-bold"
                    >{{ auth.coins.toLocaleString() }} 🪙</span
                >
            </p>

            <div v-if="loading" class="text-center text-gray-500 py-20">
                Ładowanie paczek...
            </div>

            <div
                v-else
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <div
                    v-for="pack in packs"
                    :key="pack.id"
                    class="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden hover:border-fifa-gold/50 transition-all hover:shadow-lg hover:shadow-fifa-gold/10 group"
                >
                    <!-- Wizualizacja paczki -->
                    <div
                        class="h-44 flex items-center justify-center relative overflow-hidden"
                        :class="packBg(pack)"
                    >
                        <div
                            class="text-7xl group-hover:scale-110 transition-transform duration-300"
                        >
                            {{ packIcon(pack) }}
                        </div>
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"
                        ></div>
                    </div>

                    <div class="p-5">
                        <h3 class="text-white font-bold font-fifa text-xl">
                            {{ pack.name }}
                        </h3>
                        <p class="text-gray-400 text-sm mt-1 mb-3">
                            {{ pack.description }}
                        </p>

                        <!-- Szczegóły paczki -->
                        <div class="flex gap-3 text-xs text-gray-500 mb-4">
                            <span>🎴 {{ pack.cardCount }} kart</span>
                            <span v-for="(w, r) in topRarities(pack)" :key="r">
                                {{ rarityEmoji(r) }} {{ w }}%
                            </span>
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="text-fifa-gold font-bold text-xl"
                                >{{ pack.price.toLocaleString() }} 🪙</span
                            >
                            <button
                                @click="buyPack(pack)"
                                :disabled="
                                    auth.coins < pack.price ||
                                    purchasing === pack.id
                                "
                                class="bg-fifa-gold hover:bg-fifa-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-5 rounded-lg transition-colors font-fifa"
                            >
                                {{ purchasing === pack.id ? "..." : "KUP" }}
                            </button>
                        </div>

                        <p
                            v-if="auth.coins < pack.price"
                            class="text-red-400 text-xs mt-2"
                        >
                            Brakuje Ci
                            {{ (pack.price - auth.coins).toLocaleString() }} 🪙
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Animacja otwierania paczki -->
        <div
            v-else
            class="min-h-full flex flex-col items-center justify-center p-4"
        >
            <h2
                class="text-white font-bold font-fifa text-3xl mb-2 gradient-gold text-center"
            >
                OTWIERASZ PACZKĘ!
            </h2>
            <p class="text-gray-400 mb-8 text-center">
                Wydałeś {{ lastPackPrice.toLocaleString() }} 🪙 · Pozostało:
                {{ auth.coins.toLocaleString() }} 🪙
            </p>

            <!-- Siatka kart — responsywna, nie wychodzi poza ekran -->
            <div class="w-full max-w-4xl">
                <div class="flex flex-wrap justify-center gap-4">
                    <div
                        v-for="(card, idx) in revealedCards"
                        :key="card.id"
                        class="card-reveal"
                        :style="{ animationDelay: `${idx * 0.15}s` }"
                    >
                        <PlayerCard :card="card" size="md" />
                    </div>
                </div>
            </div>

            <button
                @click="openingResult = null"
                class="mt-10 bg-fifa-gold hover:bg-fifa-gold-light text-black font-bold py-3 px-10 rounded-xl font-fifa text-lg tracking-wide transition-colors"
            >
                SUPER! WRÓĆ DO SKLEPU
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import PlayerCard from "../../components/cards/PlayerCard.vue";
import { useAuthStore } from "../../store/auth";
import api from "../../api";

const auth = useAuthStore();
const packs = ref([]);
const loading = ref(false);
const purchasing = ref(null);
const openingResult = ref(null);
const revealedCards = ref([]);
const lastPackPrice = ref(0);

onMounted(loadPacks);

async function loadPacks() {
    loading.value = true;
    try {
        const { data } = await api.get("/packs");
        packs.value = data;
    } finally {
        loading.value = false;
    }
}

async function buyPack(pack) {
    if (purchasing.value) return;
    purchasing.value = pack.id;
    try {
        const { data } = await api.post(`/packs/${pack.id}/open`);
        auth.updateCoins(-data.coinsSpent);
        lastPackPrice.value = data.coinsSpent;

        // Animacja: pokazuj karty jedna po jednej
        openingResult.value = data.cards;
        revealedCards.value = [];

        data.cards.forEach((card, idx) => {
            setTimeout(
                () => {
                    revealedCards.value.push(card);
                },
                idx * 150 + 100,
            );
        });
    } catch (err) {
        alert(err.response?.data?.error || "Błąd zakupu paczki");
    } finally {
        purchasing.value = null;
    }
}

// Helpers wizualne
function topRarities(pack) {
    const weights = pack.rarityWeights || {};
    return Object.fromEntries(
        Object.entries(weights)
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3),
    );
}

function rarityEmoji(rarity) {
    return (
        {
            bronze: "🟫",
            silver: "⬜",
            gold: "🟨",
            "gold-rare": "✨",
            special: "💜",
        }[rarity] || "🎴"
    );
}

function packIcon(pack) {
    const name = pack.name?.toLowerCase();
    if (name?.includes("special") || name?.includes("premium")) return "💜";
    if (name?.includes("gold")) return "✨";
    if (name?.includes("silver")) return "⬜";
    return "📦";
}

function packBg(pack) {
    const name = pack.name?.toLowerCase();
    if (name?.includes("special") || name?.includes("premium"))
        return "bg-gradient-to-br from-purple-900 to-indigo-900";
    if (name?.includes("gold"))
        return "bg-gradient-to-br from-yellow-900 to-amber-800";
    if (name?.includes("silver"))
        return "bg-gradient-to-br from-gray-700 to-gray-600";
    return "bg-gradient-to-br from-amber-900 to-orange-900";
}
</script>
