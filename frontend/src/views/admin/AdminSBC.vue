<template>
    <!--
    views/admin/AdminSBC.vue — Zarządzanie wyzwaniami SBC
    
    Admin może:
    - Tworzyć nowe wyzwania (Squad Building Challenges)
    - Definiować wymagania: minOverall, nationality, league, team, position, playerCount
    - Ustawiać nagrodę (paczkę)
    - Ustawiać datę wygaśnięcia
    - Ukrywać / przywracać wyzwania (toggleSBC → PUT /sbc/:id/toggle)
    
    Lista pobierana z /sbc/admin (a nie /sbc), żeby admin widział RÓWNIEŻ
    ukryte wyzwania i mógł je przywrócić — zwykły endpoint /sbc (używany
    przez graczy w SBC.vue) zwraca tylko isActive: true.
  -->
    <div class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-white font-bold font-fifa text-2xl">
                WYZWANIA SBC
            </h2>
            <button
                @click="openModal()"
                class="bg-fifa-gold hover:bg-fifa-gold-light text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
            >
                + Nowe wyzwanie
            </button>
        </div>

        <!-- Lista wyzwań -->
        <div class="space-y-4">
            <div
                v-for="sbc in sbcs"
                :key="sbc.id"
                class="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors"
                :class="{ 'opacity-50': !sbc.isActive }"
            >
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h3 class="text-white font-bold font-fifa text-lg">
                                {{ sbc.name }}
                            </h3>
                            <span
                                class="text-xs px-2 py-0.5 rounded-full"
                                :class="
                                    sbc.isActive
                                        ? 'bg-green-900 text-green-400'
                                        : 'bg-gray-800 text-gray-500'
                                "
                            >
                                {{ sbc.isActive ? "Aktywne" : "Ukryte" }}
                            </span>
                        </div>
                        <p class="text-gray-400 text-sm mb-3">
                            {{ sbc.description }}
                        </p>

                        <!-- Wymagania -->
                        <div class="flex flex-wrap gap-2 mb-3">
                            <span
                                v-for="req in sbc.requirements"
                                :key="req.id"
                                class="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full"
                            >
                                {{ reqIcon(req.type) }}
                                {{ req.label || req.value }}
                            </span>
                        </div>

                        <div class="flex items-center gap-4 text-sm">
                            <span class="text-gray-500"
                                >Nagroda:
                                <span class="text-green-400"
                                    >Paczka ID #{{ sbc.rewardPackId }}</span
                                ></span
                            >
                            <span v-if="sbc.expiresAt" class="text-orange-400"
                                >⏱
                                {{
                                    new Date(sbc.expiresAt).toLocaleDateString(
                                        "pl",
                                    )
                                }}</span
                            >
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <button
                            @click="toggleSBC(sbc)"
                            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            :class="
                                sbc.isActive
                                    ? 'bg-orange-900 text-orange-300 hover:bg-orange-800'
                                    : 'bg-green-900 text-green-300 hover:bg-green-800'
                            "
                        >
                            {{ sbc.isActive ? "Ukryj" : "Aktywuj" }}
                        </button>
                    </div>
                </div>
            </div>

            <div
                v-if="sbcs.length === 0 && !loading"
                class="text-center py-16 text-gray-500"
            >
                Brak wyzwań SBC. Dodaj pierwsze wyzwanie.
            </div>
        </div>

        <!-- Modal tworzenia SBC -->
        <div
            v-if="showModal"
            class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            @click.self="showModal = false"
        >
            <div
                class="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
                <h3 class="text-white font-bold font-fifa text-xl mb-5">
                    NOWE WYZWANIE SBC
                </h3>

                <div class="space-y-4">
                    <div>
                        <label class="text-gray-400 text-xs mb-1 block"
                            >Nazwa wyzwania *</label
                        >
                        <input
                            v-model="form.name"
                            placeholder="np. Polskie Talenty"
                            class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label class="text-gray-400 text-xs mb-1 block"
                            >Opis</label
                        >
                        <textarea
                            v-model="form.description"
                            rows="2"
                            placeholder="Opis wyzwania..."
                            class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm resize-none"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Nagroda — ID paczki *</label
                            >
                            <select
                                v-model.number="form.rewardPackId"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">— Wybierz paczkę —</option>
                                <option
                                    v-for="p in packs"
                                    :key="p.id"
                                    :value="p.id"
                                >
                                    {{ p.name }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Data wygaśnięcia</label
                            >
                            <input
                                v-model="form.expiresAt"
                                type="date"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <!-- Wymagania -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <label class="text-gray-400 text-xs"
                                >Wymagania</label
                            >
                            <button
                                @click="addRequirement"
                                class="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                            >
                                + Dodaj wymaganie
                            </button>
                        </div>

                        <div class="space-y-3">
                            <div
                                v-for="(req, idx) in form.requirements"
                                :key="idx"
                                class="flex gap-2 p-3 bg-gray-800 rounded-xl"
                            >
                                <select
                                    v-model="req.type"
                                    class="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-xs"
                                >
                                    <option value="minOverall">
                                        Min. Overall
                                    </option>
                                    <option value="nationality">
                                        Narodowość
                                    </option>
                                    <option value="league">Liga</option>
                                    <option value="team">Drużyna</option>
                                    <option value="position">Pozycja</option>
                                    <option value="playerCount">
                                        Liczba kart
                                    </option>
                                </select>
                                <input
                                    v-model="req.value"
                                    placeholder="Wartość"
                                    class="flex-1 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-xs"
                                />
                                <input
                                    v-model="req.label"
                                    placeholder="Etykieta (opcjonalna)"
                                    class="flex-1 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-xs"
                                />
                                <button
                                    @click="form.requirements.splice(idx, 1)"
                                    class="text-red-400 hover:text-red-300 text-sm font-bold px-1"
                                >
                                    ✕
                                </button>
                            </div>

                            <p
                                v-if="form.requirements.length === 0"
                                class="text-gray-600 text-xs text-center py-2"
                            >
                                Brak wymagań — wyzwanie dostępne dla każdego
                                składu
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-2">
                        <button
                            @click="saveSBC"
                            :disabled="
                                saving || !form.name || !form.rewardPackId
                            "
                            class="flex-1 bg-fifa-gold hover:bg-fifa-gold-light disabled:opacity-40 text-black font-bold py-3 rounded-xl font-fifa transition-colors"
                        >
                            {{ saving ? "Tworzenie..." : "UTWÓRZ WYZWANIE" }}
                        </button>
                        <button
                            @click="showModal = false"
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
import { ref, onMounted } from "vue";
import api from "../../api";

const sbcs = ref([]);
const packs = ref([]);
const showModal = ref(false);
const saving = ref(false);
const loading = ref(false);

const form = ref({
    name: "",
    description: "",
    rewardPackId: "",
    expiresAt: "",
    requirements: [],
});

onMounted(async () => {
    loading.value = true;
    try {
        const [sbcRes, packRes] = await Promise.all([
            api.get("/sbc/admin"),
            api.get("/packs"),
        ]);
        sbcs.value = sbcRes.data;
        packs.value = packRes.data;
    } finally {
        loading.value = false;
    }
});

function openModal() {
    form.value = {
        name: "",
        description: "",
        rewardPackId: "",
        expiresAt: "",
        requirements: [],
    };
    showModal.value = true;
}

function addRequirement() {
    form.value.requirements.push({
        type: "minOverall",
        value: "75",
        label: "",
    });
}

async function saveSBC() {
    saving.value = true;
    try {
        await api.post("/sbc", form.value);
        showModal.value = false;
        const { data } = await api.get("/sbc/admin");
        sbcs.value = data;
    } catch (err) {
        alert(err.response?.data?.error || "Błąd");
    } finally {
        saving.value = false;
    }
}

// Ukrywanie wyzwania wymaga potwierdzenia — to akcja, która natychmiast
// zabiera SBC z widoku gracza, więc przypadkowe kliknięcie mogłoby
// zaskoczyć admina. Przywracanie (aktywacja) nie wymaga potwierdzenia.
async function toggleSBC(sbc) {
    if (sbc.isActive) {
        const confirmed = confirm(
            `Ukryć wyzwanie "${sbc.name}"? Zniknie ono z widoku graczy, dopóki nie zostanie ponownie aktywowane.`,
        );
        if (!confirmed) return;
    }
    try {
        await api.put(`/sbc/${sbc.id}/toggle`);
        const { data } = await api.get("/sbc/admin");
        sbcs.value = data;
    } catch (err) {
        alert(err.response?.data?.error || "Błąd");
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
</script>
