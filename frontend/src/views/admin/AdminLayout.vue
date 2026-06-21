<template>
    <!--
    views/admin/AdminLayout.vue — Layout panelu administratora
    Zawiera boczny sidebar z nawigacją do modułów admina.
  -->
    <div class="min-h-screen bg-fifa-darker flex">
        <!-- Sidebar -->
        <aside
            class="h-screen w-56 bg-gray-900 border-r border-gray-700 flex flex-col sticky top-0 left-0 z-50"
        >
            <div class="p-4 border-b border-gray-700">
                <h1 class="text-fifa-gold font-bold font-fifa text-xl">
                    PANEL ADMINA
                </h1>
                <p class="text-gray-500 text-xs mt-1">
                    {{ auth.user?.username }}
                </p>
            </div>

            <nav class="p-3 space-y-1 flex-1">
                <router-link
                    v-for="item in navItems"
                    :key="item.to"
                    :to="item.to"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors font-fifa"
                    active-class="bg-gray-800 text-fifa-gold"
                >
                    <span>{{ item.icon }}</span>
                    <span>{{ item.label }}</span>
                </router-link>
            </nav>

            <div class="p-3 border-t border-gray-700 space-y-1">
                <button
                    @click="logout"
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 transition-colors text-sm"
                >
                    🚪 Wyloguj
                </button>
            </div>
        </aside>

        <!-- Treść -->
        <main class="flex-1 overflow-y-auto">
            <router-view />
        </main>
    </div>
</template>

<script setup>
import { useAuthStore } from "../../store/auth";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const navItems = [
    { to: "/admin/cards", icon: "🎴", label: "Karty" },
    { to: "/admin/templates", icon: "🖼️", label: "Szablony" },
    { to: "/admin/packs", icon: "📦", label: "Paczki" },
    { to: "/admin/sbc", icon: "🏆", label: "SBC" },
];

const logout = () => {
    auth.logout();
    router.push("/login");
};
</script>
