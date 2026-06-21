<template>
    <!--
    views/player/SquadView.vue — Widok składu gracza w stylu FIFA
    
    Funkcjonalności:
    - Wyświetlanie kart w formacji na boisku (np. 4-3-3, 4-4-2)
    - Ławka rezerwowych (karty obok siebie w rzędzie)
    - Wybór formacji z dropdown
    - Przeciągnij i upuść kartę z kolekcji na pozycję (TODO: drag&drop)
    - Zapis składu przez PUT /api/squad
    
    Formacja jest tablicą wierszy, gdzie każdy wiersz to pozycje:
    4-3-3: [[ST,LW,RW], [LCM,CM,RCM], [LB,LCB,RCB,RB], [GK]]
    (od napastników do bramkarza, bo boisko rysowane od góry)
    
    RESPONSYWNOŚĆ: poniżej breakpointu `lg` układ przechodzi z poziomego
    (panel + boisko obok siebie) na pionowy. Panel boczny ma wtedy
    OGRANICZONĄ wysokość (max-h-[40vh], własny scroll) zamiast `flex-1`,
    żeby długa lista kart w kolekcji nie wypychała boiska poza widoczny
    obszar ekranu — boisko (`flex-1 min-h-0`) zawsze zachowuje pozostałą
    przestrzeń i jest przewijane niezależnie.
  -->
    <div
        class="h-[calc(100vh-3.5rem-1px)] flex flex-col lg:flex-row overflow-hidden"
    >
        <!-- Panel boczny — lista kart do wyboru -->
        <div
            class="w-full lg:w-64 max-h-[40vh] lg:max-h-none lg:h-full flex-shrink-0 bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-700 flex flex-col overflow-hidden"
        >
            <div class="p-4 border-b border-gray-700 flex-shrink-0">
                <h2 class="text-white font-bold font-fifa text-lg mb-3">
                    SKŁAD
                </h2>

                <!-- Wybór formacji -->
                <select
                    v-model="selectedFormation"
                    @change="changeFormation"
                    class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm mb-3"
                >
                    <option v-for="f in formations" :key="f" :value="f">
                        {{ f }}
                    </option>
                </select>

                <div class="text-gray-400 text-sm">
                    Overall składu:
                    <span class="text-fifa-gold font-bold">{{
                        squadOverall
                    }}</span>
                </div>
            </div>

            <!-- Lista kart gracza -->
            <div class="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                <p class="text-gray-500 text-xs uppercase tracking-wide mb-2">
                    Twoje karty
                </p>
                <div
                    v-for="uc in selectableUserCards"
                    :key="uc.id"
                    class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                    @click="selectCard(uc)"
                >
                    <PlayerCard :card="uc.card" size="sm" />
                    <div class="min-w-0">
                        <p class="text-white text-xs font-bold truncate">
                            {{ uc.card.playerName }}
                        </p>
                        <p class="text-gray-400 text-xs">
                            {{ uc.card.position }} · {{ uc.card.overall }}
                        </p>
                    </div>
                </div>

                <p
                    v-if="selectableUserCards.length === 0"
                    class="text-gray-600 text-sm text-center py-4"
                >
                    Brak kart w kolekcji.<br />Kup paczkę w Sklepie!
                </p>
            </div>

            <!-- Zapisz skład -->
            <div class="p-4 border-t border-gray-700 flex-shrink-0">
                <button
                    @click="saveSquad"
                    :disabled="saving"
                    class="w-full bg-fifa-gold hover:bg-fifa-gold-light text-black font-bold py-2 rounded-lg transition-colors font-fifa tracking-wide disabled:opacity-50"
                >
                    {{ saving ? "Zapisywanie..." : "ZAPISZ SKŁAD" }}
                </button>
            </div>
        </div>

        <!-- Boisko — zawsze zachowuje pozostałą przestrzeń (flex-1 min-h-0),
             więc nie znika nawet gdy panel boczny powyżej jest długi.
             overflow-x-auto chroni przed łamaniem układu na bardzo wąskich
             ekranach, gdzie formacja (np. 4 obrońców obok siebie) jest
             szersza niż viewport — wtedy boisko przewija się w poziomie
             zamiast ściskać karty lub wychodzić poza ekran. -->
        <div class="flex-1 min-h-0 overflow-auto">
            <div class="pitch-bg min-h-full min-w-fit p-4 flex flex-col">
                <!-- Tytuł i selekcja slotu -->
                <div class="text-center mb-2">
                    <p
                        v-if="selectedSlot !== null"
                        class="text-white text-sm bg-black/40 inline-block px-3 py-1 rounded-full"
                    >
                        Kliknij kartę po lewej aby przypisać ją do pozycji
                        <strong>{{
                            formationSlots[selectedSlot]?.position
                        }}</strong>
                    </p>
                </div>

                <!-- Piłkarze na boisku wg formacji -->
                <div class="flex-1 flex flex-col justify-evenly gap-2 min-w-fit">
                    <div
                        v-for="(row, rowIdx) in formationRows"
                        :key="rowIdx"
                        class="flex justify-evenly items-center gap-2"
                    >
                        <div
                            v-for="slot in row"
                            :key="slot.slot"
                            class="flex flex-col items-center gap-1 cursor-pointer"
                            @click="clickSlot(slot.slot)"
                        >
                            <!-- Karta lub pusty slot -->
                            <PlayerCard
                                v-if="squadMap[slot.slot]"
                                :card="squadMap[slot.slot].card"
                                size="md"
                                :selected="selectedSlot === slot.slot"
                            />
                            <div
                                v-else
                                class="player-card flex flex-col items-center justify-center bg-black/30 border-2 border-dashed border-white/20 hover:border-fifa-gold/60 transition-colors"
                                :class="{
                                    'border-fifa-gold/80 bg-fifa-gold/10':
                                        selectedSlot === slot.slot,
                                }"
                            >
                                <span class="text-white/40 text-2xl">+</span>
                                <span class="text-white/40 text-xs">{{
                                    slot.position
                                }}</span>
                            </div>
                            <!-- Etykieta pozycji -->
                            <span class="text-white/70 text-xs font-bold">{{
                                slot.position
                            }}</span>
                        </div>
                    </div>
                </div>

                <!-- Ławka rezerwowych -->
                <div class="mt-4 pt-4 border-t border-white/10">
                    <p
                        class="text-white/50 text-xs text-center uppercase tracking-widest mb-3"
                    >
                        Ławka rezerwowych
                    </p>
                    <div class="flex justify-center gap-3 overflow-x-auto pb-2">
                        <div
                            v-for="benchSlot in benchSlots"
                            :key="benchSlot"
                            class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                            @click="clickBenchSlot(benchSlot)"
                        >
                            <PlayerCard
                                v-if="benchMap[benchSlot]"
                                :card="benchMap[benchSlot].card"
                                size="sm"
                                :selected="selectedBenchSlot === benchSlot"
                            />
                            <div
                                v-else
                                class="player-card size-sm flex flex-col items-center justify-center bg-black/30 border-2 border-dashed border-white/20 hover:border-fifa-silver/60 transition-colors"
                                :class="{
                                    'border-fifa-gold/80 bg-fifa-gold/10':
                                        selectedBenchSlot === benchSlot,
                                }"
                            >
                                <span class="text-white/30 text-lg">+</span>
                            </div>
                            <span class="text-white/40 text-xs">RES</span>
                        </div>
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

// ── Formacje ─────────────────────────────────────────────────────────────────
const FORMATIONS = {
    "4-3-3": [
        ["LW", "ST", "RW"],
        ["LCM", "CM", "RCM"],
        ["LB", "LCB", "RCB", "RB"],
        ["GK"],
    ],
    "4-4-2": [
        ["LS", "RS"],
        ["LM", "LCM", "RCM", "RM"],
        ["LB", "LCB", "RCB", "RB"],
        ["GK"],
    ],
    "4-2-3-1": [
        ["ST"],
        ["LAM", "CAM", "RAM"],
        ["LDM", "RDM"],
        ["LB", "LCB", "RCB", "RB"],
        ["GK"],
    ],
    "3-5-2": [
        ["LS", "RS"],
        ["LM", "LCM", "CM", "RCM", "RM"],
        ["LCB", "CB", "RCB"],
        ["GK"],
    ],
    "5-3-2": [
        ["LS", "RS"],
        ["LCM", "CM", "RCM"],
        ["LWB", "LCB", "CB", "RCB", "RWB"],
        ["GK"],
    ],
};

const formations = Object.keys(FORMATIONS);
const selectedFormation = ref("4-3-3");
const squadMap = ref({}); // slot → userCard (piłkarze)
const benchMap = ref({}); // slot → userCard (ławka)
const selectedSlot = ref(null);
const selectedBenchSlot = ref(null);
const selectedCard = ref(null);
const availableUserCards = ref([]);
const saving = ref(false);

// Sloty ułożone wierszami dla wybranej formacji
const formationRows = computed(() => {
    const rows = FORMATIONS[selectedFormation.value] || FORMATIONS["4-3-3"];
    let slotIdx = 0;
    return rows.map((positions) =>
        positions.map((position) => ({ position, slot: slotIdx++ })),
    );
});

// Płaska lista slotów
const formationSlots = computed(() => formationRows.value.flat());

const benchSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const usedPlayerIds = computed(() => {
    const ids = new Set();

    Object.values(squadMap.value).forEach((uc) => {
        if (uc?.id) ids.add(uc.id);
    });

    Object.values(benchMap.value).forEach((uc) => {
        if (uc?.id) ids.add(uc.id);
    });

    return ids;
});

const selectableUserCards = computed(() => {
    return availableUserCards.value.filter(
        (uc) => !usedPlayerIds.value.has(uc.id),
    );
});

const squadOverall = computed(() => {
    const ratings = Object.values(squadMap.value)
        .map((uc) => uc?.card?.overall || 0)
        .filter((r) => r > 0);
    if (!ratings.length) return 0;
    return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
});

// ── Pobieranie danych ─────────────────────────────────────────────────────────
onMounted(async () => {
    await Promise.all([loadSquad(), loadCollection()]);
});

async function loadSquad() {
    try {
        const { data } = await api.get("/squad");
        selectedFormation.value = data.formation || "4-3-3";
        const newSquadMap = {};
        const newBenchMap = {};
        for (const slot of data.slots || []) {
            if (slot.userCard) {
                if (slot.isBench) newBenchMap[slot.slot] = slot.userCard;
                else newSquadMap[slot.slot] = slot.userCard;
            }
        }
        squadMap.value = newSquadMap;
        benchMap.value = newBenchMap;
    } catch {}
}

async function loadCollection() {
    try {
        const { data } = await api.get("/collection?limit=100");
        availableUserCards.value = data.userCards || [];
    } catch {}
}

// ── Interakcja ────────────────────────────────────────────────────────────────
function selectCard(userCard) {
    if (usedPlayerIds.value.has(userCard.id)) {
        return;
    }
    if (selectedSlot.value !== null) {
        squadMap.value[selectedSlot.value] = userCard;
        selectedSlot.value = null;
        selectedCard.value = null;
    } else if (selectedBenchSlot.value !== null) {
        benchMap.value[selectedBenchSlot.value] = userCard;
        selectedBenchSlot.value = null;
    } else {
        selectedCard.value = userCard;
    }
}

function clickSlot(slot) {
    selectedBenchSlot.value = null;
    if (squadMap.value[slot]) {
        // Usuń kartę ze slotu jeśli kliknięto dwukrotnie
        if (selectedSlot.value === slot) {
            delete squadMap.value[slot];
            selectedSlot.value = null;
        } else {
            selectedSlot.value = slot;
        }
    } else {
        selectedSlot.value = selectedSlot.value === slot ? null : slot;
    }
}

function clickBenchSlot(slot) {
    selectedSlot.value = null;
    if (benchMap.value[slot]) {
        if (selectedBenchSlot.value === slot) {
            delete benchMap.value[slot];
            selectedBenchSlot.value = null;
        } else {
            selectedBenchSlot.value = slot;
        }
    } else {
        selectedBenchSlot.value =
            selectedBenchSlot.value === slot ? null : slot;
    }
}

function changeFormation() {
    squadMap.value = {};
    selectedSlot.value = null;
}

async function saveSquad() {
    saving.value = true;
    try {
        const players = Object.entries(squadMap.value)
            .filter(([, uc]) => uc)
            .map(([slot, uc]) => ({
                userCardId: uc.id,
                position: formationSlots.value[slot]?.position || "CM",
                slot: parseInt(slot),
            }));

        const bench = Object.entries(benchMap.value)
            .filter(([, uc]) => uc)
            .map(([slot, uc]) => ({ userCardId: uc.id, slot: parseInt(slot) }));

        await api.put("/squad", {
            formation: selectedFormation.value,
            players,
            bench,
        });
        alert("Skład zapisany!");
    } catch (err) {
        alert(err.response?.data?.error || "Błąd zapisu");
    } finally {
        saving.value = false;
    }
}
</script>
