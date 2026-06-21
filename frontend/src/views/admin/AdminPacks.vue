<template>
    <!--
    views/admin/AdminPacks.vue — Zarządzanie paczkami z kartami
    
    Admin może:
    - Tworzyć nowe paczki z nazwą, ceną, liczbą kart i wagami rzadkości
    - Edytować istniejące paczki
    - Dezaktywować paczki (nie pojawiają się w sklepie)
    
    Wagi rzadkości (rarityWeights) to suma 100%:
    np. { bronze: 60, silver: 30, gold: 9, 'gold-rare': 1, special: 0 }
  -->
    <div class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-white font-bold font-fifa text-2xl">
                PACZKI Z KARTAMI
            </h2>
            <button
                @click="openModal(null)"
                class="bg-fifa-gold hover:bg-fifa-gold-light text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
            >
                + Nowa paczka
            </button>
        </div>

        <!-- Lista paczek -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
                v-for="pack in packs"
                :key="pack.id"
                class="bg-gray-900 border rounded-xl p-5 transition-colors"
                :class="
                    pack.isActive
                        ? 'border-gray-700 hover:border-gray-500'
                        : 'border-gray-800 opacity-50'
                "
            >
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-white font-bold font-fifa text-lg">
                        {{ pack.name }}
                    </h3>
                    <span
                        class="text-xs px-2 py-1 rounded-full"
                        :class="
                            pack.isActive
                                ? 'bg-green-900 text-green-400'
                                : 'bg-gray-800 text-gray-500'
                        "
                    >
                        {{ pack.isActive ? "Aktywna" : "Ukryta" }}
                    </span>
                </div>

                <p class="text-gray-400 text-sm mb-4">{{ pack.description }}</p>

                <div class="space-y-2 text-sm mb-4">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Cena:</span>
                        <span class="text-fifa-gold font-bold"
                            >{{ pack.price.toLocaleString() }} 🪙</span
                        >
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Liczba kart:</span>
                        <span class="text-white">{{ pack.cardCount }}</span>
                    </div>
                </div>

                <!-- Wagi rzadkości jako pasek -->
                <div class="mb-4">
                    <p class="text-gray-500 text-xs mb-1">Szanse rzadkości:</p>
                    <div class="flex h-3 rounded-full overflow-hidden">
                        <div
                            v-for="(w, r) in pack.rarityWeights"
                            :key="r"
                            v-if="w > 0"
                            :title="`${r}: ${w}%`"
                            :style="{ width: `${w}%` }"
                            :class="rarityBg(r)"
                        ></div>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-1">
                        <span
                            v-for="(w, r) in pack.rarityWeights"
                            :key="r"
                            v-if="w > 0"
                            class="text-xs text-gray-500"
                        >
                            {{ rarityEmoji(r) }} {{ w }}%
                        </span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button
                        @click="openModal(pack)"
                        class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                        Edytuj
                    </button>
                    <button
                        @click="toggleActive(pack)"
                        class="px-3 py-2 rounded-lg text-sm transition-colors"
                        :class="
                            pack.isActive
                                ? 'bg-orange-900 text-orange-300 hover:bg-orange-800'
                                : 'bg-green-900 text-green-300 hover:bg-green-800'
                        "
                    >
                        {{ pack.isActive ? "Ukryj" : "Aktywuj" }}
                    </button>
                </div>
            </div>

            <div
                v-if="packs.length === 0"
                class="col-span-full text-center py-16 text-gray-500"
            >
                Brak paczek. Dodaj pierwszą paczkę.
            </div>
        </div>

        <!-- Modal tworzenia/edycji -->
        <div
            v-if="showModal"
            class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            @click.self="showModal = false"
        >
            <div
                class="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
                <h3 class="text-white font-bold font-fifa text-xl mb-5">
                    {{ editingPack ? "EDYTUJ PACZKĘ" : "NOWA PACZKA" }}
                </h3>

                <div class="space-y-4">
                    <div>
                        <label class="text-gray-400 text-xs mb-1 block"
                            >Nazwa paczki *</label
                        >
                        <input
                            v-model="form.name"
                            placeholder="np. Gold Pack"
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
                            placeholder="Opis paczki..."
                            class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm resize-none"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Cena (monety) *</label
                            >
                            <input
                                v-model.number="form.price"
                                type="number"
                                min="1"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Liczba kart *</label
                            >
                            <input
                                v-model.number="form.cardCount"
                                type="number"
                                min="1"
                                max="25"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <!-- Wagi rzadkości -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-gray-400 text-xs"
                                >Wagi rzadkości (suma = 100)</label
                            >
                            <span
                                class="text-xs font-bold"
                                :class="
                                    weightsSum === 100
                                        ? 'text-green-400'
                                        : 'text-red-400'
                                "
                            >
                                Suma: {{ weightsSum }}/100
                            </span>
                        </div>
                        <div class="space-y-2">
                            <div
                                v-for="rarity in rarities"
                                :key="rarity"
                                class="flex items-center gap-3"
                            >
                                <span class="w-24 text-xs text-gray-400"
                                    >{{ rarityEmoji(rarity) }}
                                    {{ rarity }}</span
                                >
                                <input
                                    v-model.number="form.rarityWeights[rarity]"
                                    type="number"
                                    min="0"
                                    max="100"
                                    class="w-20 bg-gray-800 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                />
                                <div
                                    class="flex-1 h-2 rounded-full overflow-hidden bg-gray-700"
                                >
                                    <div
                                        :class="rarityBg(rarity)"
                                        :style="{
                                            width: `${form.rarityWeights[rarity] || 0}%`,
                                        }"
                                        class="h-full transition-all"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-2">
                        <button
                            @click="savePack"
                            :disabled="
                                saving || !form.name || weightsSum !== 100
                            "
                            class="flex-1 bg-fifa-gold hover:bg-fifa-gold-light disabled:opacity-40 text-black font-bold py-3 rounded-xl font-fifa transition-colors"
                        >
                            {{
                                saving
                                    ? "Zapisywanie..."
                                    : editingPack
                                      ? "ZAPISZ"
                                      : "UTWÓRZ"
                            }}
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
import { ref, computed, onMounted } from "vue";
import api from "../../api";

const packs = ref([]);
const showModal = ref(false);
const editingPack = ref(null);
const saving = ref(false);
const rarities = ["bronze", "silver", "gold", "gold-rare", "special"];

const defaultForm = () => ({
    name: "",
    description: "",
    price: 1000,
    cardCount: 5,
    isActive: true,
    rarityWeights: {
        bronze: 60,
        silver: 30,
        gold: 9,
        "gold-rare": 1,
        special: 0,
    },
});

const form = ref(defaultForm());
const weightsSum = computed(() =>
    Object.values(form.value.rarityWeights).reduce((a, b) => a + (b || 0), 0),
);

onMounted(loadPacks);

async function loadPacks() {
    const { data } = await api.get("/packs");
    packs.value = data;
}

function openModal(pack) {
    editingPack.value = pack;
    if (pack) {
        form.value = {
            name: pack.name,
            description: pack.description || "",
            price: pack.price,
            cardCount: pack.cardCount,
            isActive: pack.isActive,
            rarityWeights:
                typeof pack.rarityWeights === "string"
                    ? JSON.parse(pack.rarityWeights)
                    : { ...pack.rarityWeights },
        };
    } else {
        form.value = defaultForm();
    }
    showModal.value = true;
}

async function savePack() {
    saving.value = true;
    try {
        const payload = { ...form.value };
        if (editingPack.value) {
            await api.put(`/packs/${editingPack.value.id}`, payload);
        } else {
            await api.post("/packs", payload);
        }
        showModal.value = false;
        await loadPacks();
    } catch (err) {
        alert(err.response?.data?.error || "Błąd");
    } finally {
        saving.value = false;
    }
}

// Ukrywanie paczki wymaga potwierdzenia — to akcja, która natychmiast
// zabiera paczkę ze sklepu graczy, więc przypadkowe kliknięcie mogłoby
// zaskoczyć admina. Aktywacja (przywrócenie) nie wymaga potwierdzenia,
// bo jest nieszkodliwa i odwracalna jednym kliknięciem.
async function toggleActive(pack) {
    if (pack.isActive) {
        const confirmed = confirm(
            `Ukryć paczkę "${pack.name}"? Zniknie ona ze sklepu dla wszystkich graczy, dopóki nie zostanie ponownie aktywowana.`,
        );
        if (!confirmed) return;
    }
    try {
        await api.put(`/packs/${pack.id}/toggle`);
        const { data } = await api.get("/packs/admin");
        packs.value = data;
    } catch (err) {
        alert(err.response?.data?.error || "Błąd");
    }
}

function rarityEmoji(r) {
    return (
        {
            bronze: "🟫",
            silver: "⬜",
            gold: "🟨",
            "gold-rare": "✨",
            special: "💜",
        }[r] || ""
    );
}

function rarityBg(r) {
    return (
        {
            bronze: "bg-amber-700",
            silver: "bg-gray-400",
            gold: "bg-yellow-500",
            "gold-rare": "bg-yellow-300",
            special: "bg-purple-500",
        }[r] || "bg-gray-600"
    );
}
</script>
