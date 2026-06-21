/**
 * src/store/auth.js — Store autoryzacji (Pinia)
 *
 * Zarządza stanem zalogowanego użytkownika.
 * Token JWT przechowywany w localStorage.
 * user: { id, username, email, role, coins, points }
 */

import { defineStore } from "pinia";
import api from "../api";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: JSON.parse(localStorage.getItem("user") || "null"),
        token: localStorage.getItem("token") || null,
        loading: false,
    }),

    getters: {
        isLoggedIn: (state) => !!state.token,
        isAdmin: (state) => state.user?.role === "admin",
        coins: (state) => state.user?.coins || 0,
    },

    actions: {
        async login(email, password) {
            this.loading = true;
            try {
                const { data } = await api.post("/auth/login", {
                    email,
                    password,
                });
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                return data;
            } finally {
                this.loading = false;
            }
        },

        async register(username, email, password) {
            this.loading = true;
            try {
                const { data } = await api.post("/auth/register", {
                    username,
                    email,
                    password,
                });
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                return data;
            } finally {
                this.loading = false;
            }
        },

        async refreshUser() {
            try {
                const { data } = await api.get("/auth/me");
                this.user = data;
                localStorage.setItem("user", JSON.stringify(data));
            } catch {}
        },

        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        },

        updateCoins(amount) {
            if (this.user) {
                this.user.coins += amount;
                localStorage.setItem("user", JSON.stringify(this.user));
            }
        },
    },
});
