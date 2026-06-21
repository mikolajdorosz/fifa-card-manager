<template>
    <!--
    views/player/SBC.vue — Squad Building Challenges
    
    Gracz:
    - Widzi listę aktywnych wyzwań z wymaganiami (jak w FIFA)
    - Wybiera wyzwanie, widzi szczegóły (wymagania + nagroda)
    - Wybiera 11 kart ze swojej kolekcji
    - Wysyła skład → karty są zużywane → dostaje paczkę w nagrodę
    
    Wymagania są walidowane na żywo przed wysłaniem.
  -->
    <div class="min-h-full bg-fifa-darker p-4">
        <div class="max-w-screen-xl mx-auto">
            <h2
                class="text-white font-bold font-fifa text-3xl mb-6 gradient-gold"
            >
                SBC — WYZWANIA SKŁADU
            </h2>

            <!-- Lista wyzwań + wybranie wyzwania -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Lista SBC -->
                <div class="lg:col-span-1 space-y-3">
                    <p class="text-gray-400 text-sm uppercase tracking-wide">
                        Dostępne wyzwania
                    </p>
                    <div
                        v-for="sbc in sbcs"
                        :key="sbc.id"
                        @click="selectSBC(sbc)"
                        class="bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-fifa-gold/60"
                        :class="
                            selectedSBC?.id === sbc.id
                                ? 'border-fifa-gold'
                                : 'border-gray-700'
                        "
                    >
                        <h3 class="text-white font-bold font-fifa">
                            {{ sbc.name }}
                        </h3>
                        <p class="text-gray-400 text-sm mt-1">
                            {{ sbc.description }}
                        </p>
                        <div class="flex items-center justify-between mt-3">
                            <span class="text-green-400 text-sm"
                                >🎁 {{ sbc.requirements?.length }} wymagań</span
                            >
                            <span
                                v-if="sbc.expiresAt"
                                class="text-orange-400 text-xs"
                            >
                                ⏱
                                {{
                                    new Date(sbc.expiresAt).toLocaleDateString(
                                        "pl",
                                    )
                                }}
                            </span>
                        </div>
                    </div>
                    <p
                        v-if="sbcs.length === 0 && !loading"
                        class="text-gray-600 text-sm text-center py-8"
                    >
                        Brak aktywnych wyzwań
                    </p>
                </div>

                <!-- Szczegóły wybranego SBC -->
                <div class="lg:col-span-2">
                    <div
                        v-if="!selectedSBC"
                        class="flex items-center justify-center h-64 bg-gray-900 rounded-2xl border border-gray-700"
                    >
                        <p class="text-gray-500">← Wybierz wyzwanie z listy</p>
                    </div>

                    <div v-else class="space-y-5">
                        <!-- Wymagania -->
                        <div
                            class="bg-gray-900 border border-gray-700 rounded-2xl p-5"
                        >
                            <h3
                                class="text-white font-bold font-fifa text-xl mb-4"
                            >
                                {{ selectedSBC.name }}
                            </h3>

                            <div
                                class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
                            >
                                <div
                                    v-for="req in selectedSBC.requirements"
                                    :key="req.id"
                                    class="flex items-center gap-3 bg-gray-800 rounded-xl p-3"
                                    :class="
                                        checkRequirement(req)
                                            ? 'border border-green-500/50'
                                            : 'border border-gray-700'
                                    "
                                >
                                    <span class="text-2xl">{{
                                        reqIcon(req.type)
                                    }}</span>
                                    <div>
                                        <p class="text-white text-sm font-bold">
                                            {{ req.label || req.value }}
                                        </p>
                                        <p class="text-gray-400 text-xs">
                                            {{ reqDescription(req) }}
                                        </p>
                                    </div>
                                    <span
                                        v-if="checkRequirement(req)"
                                        class="ml-auto text-green-400 text-lg"
                                        >✓</span
                                    >
                                </div>
                            </div>

                            <!-- Nagroda -->
                            <div
                                class="bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border border-fifa-gold/30 rounded-xl p-4 flex items-center gap-4"
                            >
                                <span class="text-4xl">🎁</span>
                                <div>
                                    <p class="text-gray-400 text-sm">Nagroda</p>
                                    <p
                                        class="text-white font-bold font-fifa text-lg"
                                    >
                                        Paczka kart
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Wybierz karty -->
                        <div
                            class="bg-gray-900 border border-gray-700 rounded-2xl p-5"
                        >
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-white font-bold font-fifa">
                                    WYBIERZ KARTY ({{
                                        selectedCards.length
                                    }}/11)
                                </h4>
                                <button
                                    v-if="selectedCards.length > 0"
                                    @click="selectedCards = []"
                                    class="text-gray-400 hover:text-red-400 text-sm transition-colors"
                                >
                                    Wyczyść
                                </button>
                            </div>

                            <!-- Wybrane karty -->
                            <div
                                class="flex flex-wrap gap-2 min-h-12 mb-4 p-2 bg-gray-800 rounded-xl"
                            >
                                <PlayerCard
                                    v-for="uc in selectedCards"
                                    :key="uc.id"
                                    :card="uc.card"
                                    size="sm"
                                    :selected="true"
                                    @click="removeCard(uc)"
                                />
                                <p
                                    v-if="selectedCards.length === 0"
                                    class="text-gray-600 text-sm self-center ml-2"
                                >
                                    Kliknij karty poniżej aby je wybrać
                                </p>
                            </div>

                            <!-- Kolekcja gracza do wyboru -->
                            <div
                                class="flex flex-wrap gap-2 max-h-52 overflow-y-auto"
                            >
                                <PlayerCard
                                    v-for="uc in availableCards"
                                    :key="uc.id"
                                    :card="uc.card"
                                    size="sm"
                                    :selected="isSelected(uc)"
                                    @click="toggleCard(uc)"
                                />
                            </div>

                            <button
                                @click="submitSBC"
                                :disabled="
                                    selectedCards.length < 1 ||
                                    submitting ||
                                    !allRequirementsMet
                                "
                                class="w-full mt-4 bg-fifa-gold hover:bg-fifa-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl font-fifa text-lg transition-colors"
                            >
                                {{
                                    submitting
                                        ? "Wysyłanie..."
                                        : !allRequirementsMet
                                          ? "Spełnij wymagania"
                                          : "WYŚLIJ SKŁAD"
                                }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal nagrody -->
            <div
                v-if="reward"
                class="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4"
            >
                <h2
                    class="text-white font-bold font-fifa text-3xl mb-2 gradient-gold text-center"
                >
                    WYZWANIE UKOŃCZONE!
                </h2>
                <p class="text-gray-400 mb-6">
                    Otrzymałeś {{ reward.cards.length }} kart
                </p>
                <div class="flex flex-wrap justify-center gap-3 max-w-2xl">
                    <PlayerCard
                        v-for="(card, i) in reward.cards"
                        :key="i"
                        :card="card"
                        size="md"
                        class="card-reveal"
                        :style="{ animationDelay: `${i * 0.15}s` }"
                    />
                </div>
                <button
                    @click="
                        reward = null;
                        selectedSBC = null;
                        selectedCards = [];
                    "
                    class="mt-8 bg-fifa-gold text-black font-bold py-3 px-10 rounded-xl font-fifa text-lg"
                >
                    ŚWIETNIE!
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import PlayerCard from "../../components/cards/PlayerCard.vue";
import api from "../../api";

const sbcs = ref([]);
const selectedSBC = ref(null);
const selectedCards = ref([]);
const availableCards = ref([]);
const loading = ref(false);
const submitting = ref(false);
const reward = ref(null);

onMounted(async () => {
    loading.value = true;
    try {
        const [sbcRes, colRes] = await Promise.all([
            api.get("/sbc"),
            api.get("/collection?limit=200"),
        ]);
        sbcs.value = sbcRes.data;
        availableCards.value = colRes.data.userCards.filter(
            (uc) => !uc.isListed,
        );
    } finally {
        loading.value = false;
    }
});

function selectSBC(sbc) {
    selectedSBC.value = sbc;
    selectedCards.value = [];
}

function isSelected(uc) {
    return selectedCards.value.some((c) => c.id === uc.id);
}

function toggleCard(uc) {
    if (isSelected(uc)) {
        removeCard(uc);
    } else if (selectedCards.value.length < 11) {
        selectedCards.value.push(uc);
    }
}

function removeCard(uc) {
    selectedCards.value = selectedCards.value.filter((c) => c.id !== uc.id);
}

// Sprawdź wymaganie na żywo
function checkRequirement(req) {
    const cards = selectedCards.value.map((uc) => uc.card);
    if (!cards.length) return false;
    switch (req.type) {
        case "minOverall": {
            const avg = Math.round(
                cards.reduce((s, c) => s + c.overall, 0) / cards.length,
            );
            return avg >= parseInt(req.value);
        }
        case "nationality":
            return cards.some((c) =>
                c.nationality?.toLowerCase().includes(req.value.toLowerCase()),
            );
        case "league":
            return cards.some((c) =>
                c.league?.toLowerCase().includes(req.value.toLowerCase()),
            );
        case "playerCount":
            return cards.length >= parseInt(req.value);
        default:
            return false;
    }
}

const allRequirementsMet = computed(() => {
    if (!selectedSBC.value) return false;
    return selectedSBC.value.requirements.every((r) => checkRequirement(r));
});

async function submitSBC() {
    submitting.value = true;
    try {
        const { data } = await api.post(`/sbc/${selectedSBC.value.id}/submit`, {
            cardIds: selectedCards.value.map((uc) => uc.id),
        });
        reward.value = data.reward;
        // Odśwież kolekcję
        const colRes = await api.get("/collection?limit=200");
        availableCards.value = colRes.data.userCards.filter(
            (uc) => !uc.isListed,
        );
    } catch (err) {
        alert(err.response?.data?.error || "Błąd zgłoszenia");
    } finally {
        submitting.value = false;
    }
}

function reqIcon(type) {
    return (
        {
            minOverall: "⭐",
            nationality: "🌍",
            league: "🏟️",
            team: "🛡️",
            position: "📍",
            playerCount: "👥",
        }[type] || "📋"
    );
}
function reqDescription(req) {
    return (
        {
            minOverall: `Min. overall: ${req.value}`,
            nationality: `Narodowość: ${req.value}`,
            league: `Liga: ${req.value}`,
            playerCount: `Min. kart: ${req.value}`,
            team: `Drużyna: ${req.value}`,
            position: `Pozycja: ${req.value}`,
        }[req.type] || req.value
    );
}
</script>
