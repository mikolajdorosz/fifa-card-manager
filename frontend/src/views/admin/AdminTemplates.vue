<template>
    <!--
    views/admin/AdminTemplates.vue — Zarządzanie szablonami kart (ramkami/tłami)
    
    Admin definiuje szablony wizualne kart.
    Każda zmiana szablonu natychmiast (live) zmienia wygląd wszystkich kart
    bazujących na nim — dzięki dynamicznemu renderowaniu w PlayerCard.vue.
    
    Pola szablonu:
    - name: nazwa (np. "Gold Rare")
    - rarity: enum (bronze/silver/gold/gold-rare/special)
    - bgColor: kolor tła w CSS (#hex) — używany, gdy brak obrazka tła
    - backgroundImageUrl: opcjonalny obrazek tła (zastępuje bgColor, gdy ustawiony)
    - borderColor: kolor obramowania
    - textColor: kolor tekstu
    - accentColor: kolor akcentów (statystyki, podkreślenia)
    
    UWAGA: pole `cssClass` NIE jest tu ustawiane ręcznie — backend
    wyprowadza je automatycznie z `rarity` (patrz templateController.js).
    Admin nie musi znać CSS, żeby stworzyć szablon.
  -->
    <div class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-white font-bold font-fifa text-2xl">
                SZABLONY KART
            </h2>
            <button
                @click="openModal(null)"
                class="bg-fifa-gold hover:bg-fifa-gold-light text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
            >
                + Nowy szablon
            </button>
        </div>

        <!-- Lista szablonów -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div
                v-for="t in templates"
                :key="t.id"
                class="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-gray-500 transition-colors"
            >
                <!-- Podgląd wyglądu szablonu (obrazek tła lub kolor) -->
                <div
                    class="h-16 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden border-2 bg-cover bg-center"
                    :style="{
                        background: t.backgroundImageUrl
                            ? `url(${t.backgroundImageUrl}) center/cover`
                            : t.bgColor,
                        borderColor: t.borderColor,
                    }"
                >
                    <span
                        class="font-bold font-fifa text-lg drop-shadow"
                        :style="{ color: t.textColor }"
                        >{{ t.name }}</span
                    >
                </div>

                <!-- Informacje -->
                <div class="space-y-1 text-xs mb-3">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Rzadkość:</span>
                        <span class="text-white font-bold">{{ t.rarity }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Tło:</span>
                        <span class="text-white">{{
                            t.backgroundImageUrl ? "Obrazek" : "Kolor"
                        }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-500">Kolory:</span>
                        <div class="flex gap-1">
                            <div
                                class="w-4 h-4 rounded-full border border-gray-600"
                                :style="{ background: t.bgColor }"
                                :title="`Tło: ${t.bgColor}`"
                            ></div>
                            <div
                                class="w-4 h-4 rounded-full border border-gray-600"
                                :style="{ background: t.borderColor }"
                                :title="`Ramka: ${t.borderColor}`"
                            ></div>
                            <div
                                class="w-4 h-4 rounded-full border border-gray-600"
                                :style="{ background: t.textColor }"
                                :title="`Tekst: ${t.textColor}`"
                            ></div>
                            <div
                                class="w-4 h-4 rounded-full border border-gray-600"
                                :style="{ background: t.accentColor }"
                                :title="`Akcent: ${t.accentColor}`"
                            ></div>
                        </div>
                    </div>
                </div>

                <!-- Podgląd karty przykładowej -->
                <div class="flex justify-center mb-3">
                    <PlayerCard :card="exampleCard(t)" size="sm" />
                </div>

                <div class="flex gap-2">
                    <button
                        @click="openModal(t)"
                        class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded text-xs font-bold transition-colors"
                    >
                        Edytuj
                    </button>
                    <button
                        @click="deleteTemplate(t)"
                        class="bg-red-900 hover:bg-red-800 text-red-300 px-3 py-1.5 rounded text-xs transition-colors"
                    >
                        Usuń
                    </button>
                </div>
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
                    {{ editingTemplate ? "EDYTUJ SZABLON" : "NOWY SZABLON" }}
                </h3>

                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Nazwa *</label
                            >
                            <input
                                v-model="form.name"
                                placeholder="np. Gold Rare"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Rzadkość *</label
                            >
                            <select
                                v-model="form.rarity"
                                class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="bronze">Bronze</option>
                                <option value="silver">Silver</option>
                                <option value="gold">Gold</option>
                                <option value="gold-rare">Gold Rare</option>
                                <option value="special">Special</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="text-gray-400 text-xs mb-1 block"
                            >Obrazek tła (opcjonalnie)</label
                        >
                        <p class="text-gray-600 text-xs mb-2">
                            Gdy ustawiony, zastępuje kolor tła karty.
                        </p>
                        <div
                            v-if="form.backgroundImageUrl"
                            class="flex items-center gap-3 p-3 bg-gray-800 rounded-xl mb-2"
                        >
                            <img
                                :src="form.backgroundImageUrl"
                                class="w-16 h-16 object-cover rounded-lg border border-gray-600"
                            />
                            <div class="flex-1 text-xs text-gray-400">
                                Obrazek ustawiony jako tło szablonu.
                            </div>
                            <button
                                @click="removeBackgroundImage"
                                type="button"
                                class="bg-red-900 hover:bg-red-800 text-red-300 px-3 py-1.5 rounded text-xs transition-colors"
                            >
                                Usuń
                            </button>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            @change="onBackgroundFileChange"
                            class="text-gray-400 text-sm"
                        />
                        <p
                            v-if="pendingBackgroundFile"
                            class="text-gray-600 text-xs mt-1"
                        >
                            Plik "{{ pendingBackgroundFile.name }}" zostanie
                            przesłany po zapisaniu szablonu.
                        </p>
                    </div>

                    <!-- Kolory -->
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Kolor tła</label
                            >
                            <p
                                v-if="form.backgroundImageUrl"
                                class="text-gray-600 text-xs mb-1"
                            >
                                Nieaktywny — użyty jest obrazek tła
                            </p>
                            <div class="flex gap-2 items-center">
                                <input
                                    type="color"
                                    v-model="form.bgColor"
                                    :disabled="!!form.backgroundImageUrl"
                                    class="w-10 h-10 rounded cursor-pointer bg-transparent border-0 disabled:opacity-40"
                                />
                                <input
                                    v-model="form.bgColor"
                                    :disabled="!!form.backgroundImageUrl"
                                    class="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-2 py-2 text-xs font-mono disabled:opacity-40"
                                />
                            </div>
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Kolor ramki</label
                            >
                            <div class="flex gap-2 items-center">
                                <input
                                    type="color"
                                    v-model="form.borderColor"
                                    class="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                                />
                                <input
                                    v-model="form.borderColor"
                                    class="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-2 py-2 text-xs font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Kolor tekstu</label
                            >
                            <div class="flex gap-2 items-center">
                                <input
                                    type="color"
                                    v-model="form.textColor"
                                    class="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                                />
                                <input
                                    v-model="form.textColor"
                                    class="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-2 py-2 text-xs font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label class="text-gray-400 text-xs mb-1 block"
                                >Kolor akcentu</label
                            >
                            <div class="flex gap-2 items-center">
                                <input
                                    type="color"
                                    v-model="form.accentColor"
                                    class="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                                />
                                <input
                                    v-model="form.accentColor"
                                    class="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-2 py-2 text-xs font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Live podgląd karty -->
                    <div class="border-t border-gray-700 pt-4">
                        <p class="text-gray-400 text-xs mb-3">
                            Podgląd karty (live)
                        </p>
                        <div class="flex justify-center">
                            <PlayerCard :card="previewCard" size="lg" />
                        </div>
                    </div>

                    <div class="flex gap-3 pt-2">
                        <button
                            @click="saveTemplate"
                            :disabled="saving || !form.name"
                            class="flex-1 bg-fifa-gold hover:bg-fifa-gold-light disabled:opacity-40 text-black font-bold py-3 rounded-xl font-fifa transition-colors"
                        >
                            {{
                                saving
                                    ? "Zapisywanie..."
                                    : editingTemplate
                                      ? "ZAPISZ ZMIANY"
                                      : "UTWÓRZ SZABLON"
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
import PlayerCard from "../../components/cards/PlayerCard.vue";
import api from "../../api";

const templates = ref([]);
const showModal = ref(false);
const editingTemplate = ref(null);
const saving = ref(false);

// Plik wybrany przez admina, ale jeszcze nieprzesłany — przesyłany jest
// dopiero PO zapisaniu szablonu (bo upload wymaga istniejącego ID szablonu).
const pendingBackgroundFile = ref(null);

const defaultForm = () => ({
    name: "",
    rarity: "gold",
    bgColor: "#c8a84b",
    borderColor: "#f0d060",
    textColor: "#1a1a1a",
    accentColor: "#8b6914",
    backgroundImageUrl: "",
});

const form = ref(defaultForm());

const previewCard = computed(() => ({
    playerName: "Przykładowy Gracz",
    position: "ST",
    overall: 88,
    stats: {
        pace: 88,
        shooting: 90,
        passing: 82,
        dribbling: 91,
        defending: 35,
        physical: 77,
    },
    imageUrl: null,
    template: { ...form.value },
}));

onMounted(loadTemplates);

async function loadTemplates() {
    const { data } = await api.get("/templates");
    templates.value = data;
}

function openModal(template) {
    editingTemplate.value = template;
    form.value = template ? { ...template } : defaultForm();
    pendingBackgroundFile.value = null;
    showModal.value = true;
}

function exampleCard(t) {
    return {
        playerName: "Sample",
        position: "ST",
        overall: 88,
        stats: {
            pace: 85,
            shooting: 88,
            passing: 80,
            dribbling: 90,
            defending: 30,
            physical: 75,
        },
        imageUrl: null,
        template: t,
    };
}

// Plik wybrany w <input type="file"> — pokazujemy lokalny podgląd od razu
// (URL.createObjectURL), a właściwy upload na backend nastąpi w saveTemplate.
function onBackgroundFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingBackgroundFile.value = file;
    form.value.backgroundImageUrl = URL.createObjectURL(file);
}

// Usuwa obrazek tła — wraca do renderowania kolorem (bgColor).
// Jeśli edytujemy istniejący szablon, backendImageUrl zostanie wyczyszczone
// w bazie dopiero po kliknięciu "Zapisz zmiany" (saveTemplate wysyła null).
function removeBackgroundImage() {
    form.value.backgroundImageUrl = "";
    pendingBackgroundFile.value = null;
}

async function saveTemplate() {
    saving.value = true;
    try {
        // backgroundImageUrl wysyłane do JSON-owego create/update musi być
        // albo prawdziwym zapisanym URL-em (string z backendu), albo null.
        // Nigdy nie wysyłamy lokalnego "blob:" URL-a (podgląd pliku przed
        // uploadem) — w tym wypadku pole jest puste do czasu właściwego
        // uploadu pliku w drugim kroku poniżej.
        const payload = { ...form.value };
        const hasRealUrl =
            payload.backgroundImageUrl &&
            !payload.backgroundImageUrl.startsWith("blob:");
        payload.backgroundImageUrl = hasRealUrl
            ? payload.backgroundImageUrl
            : null;

        let templateId = editingTemplate.value?.id;
        if (templateId) {
            await api.put(`/templates/${templateId}`, payload);
        } else {
            const { data } = await api.post("/templates", payload);
            templateId = data.id;
        }

        // Jeśli admin wybrał nowy plik obrazka tła, prześlij go teraz —
        // dopiero gdy znamy templateId (po utworzeniu/aktualizacji rekordu).
        if (pendingBackgroundFile.value && templateId) {
            const fd = new FormData();
            fd.append("image", pendingBackgroundFile.value);
            await api.post(`/templates/${templateId}/background-image`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        }

        showModal.value = false;
        pendingBackgroundFile.value = null;
        await loadTemplates();
    } catch (err) {
        alert(err.response?.data?.error || "Błąd");
    } finally {
        saving.value = false;
    }
}

async function deleteTemplate(t) {
    if (
        !confirm(
            `Usunąć szablon "${t.name}"? Karty bazujące na nim stracą wygląd!`,
        )
    )
        return;
    await api.delete(`/templates/${t.id}`);
    await loadTemplates();
}
</script>
