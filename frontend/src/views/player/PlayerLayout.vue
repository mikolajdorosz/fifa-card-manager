<template>
    <!--
    views/player/PlayerLayout.vue — Główny layout gracza
    
    Zawiera:
    - Górny pasek nawigacji z zakładkami (Skład, Kolekcja, SBC, Rynek, Sklep)
    - Informacje o graczu (monety, punkty)
    - <router-view> dla aktualnej zakładki
    
    Zakładki odpowiadają wymaganiom prowadzącego:
    ✅ Skład gracza (formacja FIFA)
    ✅ Kolekcja kart (galeria z filtrowaniem)
    ✅ SBC (Squad Building Challenges)
    ✅ Rynek transferowy
    ✅ Sklep z paczkami
  -->
    <div class="bg-fifa-darker flex flex-col">
        <!-- Nawigacja górna -->
        <nav class="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
            <div class="max-w-screen-xl mx-auto px-4">
                <div class="flex items-center justify-between h-14">
                    <!-- Logo -->
                    <div class="flex items-center gap-3">
                        <span
                            class="text-2xl font-bold gradient-gold font-fifa tracking-widest"
                            >FIFA</span
                        >
                        <span class="text-gray-500 text-sm hidden sm:block"
                            >Card Manager</span
                        >
                    </div>

                    <!-- Zakładki -->
                    <div class="flex items-center gap-1 overflow-x-auto">
                        <router-link
                            v-for="tab in tabs"
                            :key="tab.to"
                            :to="tab.to"
                            class="nav-tab"
                            active-class="nav-tab-active"
                        >
                            <span class="hidden sm:inline">{{
                                tab.label
                            }}</span>
                            <span class="sm:hidden text-lg">{{
                                tab.icon
                            }}</span>
                        </router-link>
                    </div>

                    <!-- Informacje gracza -->
                    <div class="flex items-center gap-3">
                        <div
                            class="flex items-center gap-1 text-fifa-gold font-bold text-sm"
                        >
                            <span>🪙</span>
                            <span>{{ auth.coins.toLocaleString() }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span
                                class="text-gray-400 text-sm hidden md:block"
                                >{{ auth.user?.username }}</span
                            >
                            <button
                                @click="logout"
                                class="text-gray-500 hover:text-red-400 text-sm transition-colors"
                            >
                                Wyloguj
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Zawartość zakładki -->
        <main class="flex-1 overflow-hidden">
            <router-view />
        </main>
    </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../../store/auth";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const tabs = [
    { to: "/squad", label: "Skład", icon: "⚽" },
    { to: "/collection", label: "Kolekcja", icon: "🎴" },
    { to: "/sbc", label: "SBC", icon: "🏆" },
    { to: "/market", label: "Rynek", icon: "💰" },
    { to: "/shop", label: "Sklep", icon: "🛒" },
];

const logout = () => {
    auth.logout();
    router.push("/login");
};

// Odśwież saldo monet co 10s, żeby sprzedawca zobaczył zapłatę za kartę
// kupioną przez kogoś innego bez konieczności ręcznego przelogowania.
const BALANCE_POLL_MS = 10000;
let balancePoll = null;

function onVisibilityChange() {
    if (document.visibilityState === "visible") auth.refreshUser();
}

onMounted(() => {
    balancePoll = setInterval(() => auth.refreshUser(), BALANCE_POLL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
});

onUnmounted(() => {
    if (balancePoll) clearInterval(balancePoll);
    document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<style scoped>
.nav-tab {
    @apply px-3 py-2 text-sm font-semibold text-gray-400 hover:text-white rounded-lg
         transition-colors whitespace-nowrap font-fifa tracking-wide;
}
.nav-tab-active {
    @apply text-fifa-gold bg-gray-800;
}
</style>
