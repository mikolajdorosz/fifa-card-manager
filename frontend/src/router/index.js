/**
 * src/router/index.js — Konfiguracja tras Vue Router
 *
 * Trasy gracza: /squad, /collection, /sbc, /market, /shop
 * Trasy admina: /admin/cards, /admin/templates, /admin/packs, /admin/sbc
 * Publiczne: /login, /register
 *
 * Guard nawigacyjny sprawdza czy użytkownik jest zalogowany i ma
 * odpowiednią rolę przed wejściem na chronione strony.
 */

import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth";

// Lazy-load widoków dla lepszej wydajności
const Login = () => import("../views/Login.vue");
const Register = () => import("../views/Register.vue");
const PlayerLayout = () => import("../views/player/PlayerLayout.vue");
const SquadView = () => import("../views/player/SquadView.vue");
const Collection = () => import("../views/player/Collection.vue");
const SBC = () => import("../views/player/SBC.vue");
const Market = () => import("../views/player/Market.vue");
const Shop = () => import("../views/player/Shop.vue");

const AdminLayout = () => import("../views/admin/AdminLayout.vue");
const AdminCards = () => import("../views/admin/AdminCards.vue");
const AdminTemplates = () => import("../views/admin/AdminTemplates.vue");
const AdminPacks = () => import("../views/admin/AdminPacks.vue");
const AdminSBC = () => import("../views/admin/AdminSBC.vue");

const routes = [
    { path: "/login", component: Login, meta: { public: true } },
    { path: "/register", component: Register, meta: { public: true } },

    {
        path: "/",
        component: PlayerLayout,
        // playerOnly: admin NIE może tu wejść
        meta: { requiresAuth: true, playerOnly: true },
        redirect: "/squad",
        children: [
            { path: "squad", component: SquadView, name: "squad" },
            { path: "collection", component: Collection, name: "collection" },
            { path: "sbc", component: SBC, name: "sbc" },
            { path: "market", component: Market, name: "market" },
            { path: "shop", component: Shop, name: "shop" },
        ],
    },

    {
        path: "/admin",
        component: AdminLayout,
        meta: { requiresAuth: true, requiresAdmin: true },
        redirect: "/admin/cards",
        children: [
            { path: "cards", component: AdminCards, name: "admin-cards" },
            {
                path: "templates",
                component: AdminTemplates,
                name: "admin-templates",
            },
            { path: "packs", component: AdminPacks, name: "admin-packs" },
            { path: "sbc", component: AdminSBC, name: "admin-sbc" },
        ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/squad" },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const auth = useAuthStore();

    if (to.meta.public) return next();

    // Niezalogowany -> login
    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        return next("/login");
    }

    // Admin próbuje wejść na widok gracza -> przekierowanie do admina
    if (to.meta.playerOnly && auth.isAdmin) {
        return next("/admin");
    }

    // Nie-admin próbuje wejść do panelu admina -> przekieruj do gry
    if (to.meta.requiresAdmin && !auth.isAdmin) {
        return next("/squad");
    }

    next();
});

export default router;
