<template>
    <!--
    views/Login.vue — Strona logowania
    Obsługuje logowanie i przekierowanie do odpowiedniego panelu (/squad lub /admin)
  -->
    <div
        class="min-h-screen bg-fifa-darker flex items-center justify-center p-4"
    >
        <div class="w-full max-w-md">
            <!-- Logo -->
            <div class="text-center mb-8">
                <h1
                    class="text-5xl font-bold gradient-gold font-fifa tracking-widest"
                >
                    FIFA
                </h1>
                <p class="text-fifa-silver mt-1 tracking-wide">CARD MANAGER</p>
            </div>

            <!-- Formularz -->
            <div
                class="bg-gray-900 border border-gray-700 rounded-xl p-8 shadow-2xl"
            >
                <h2 class="text-2xl font-bold text-white mb-6 font-fifa">
                    ZALOGUJ SIĘ
                </h2>

                <div
                    v-if="error"
                    class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm"
                >
                    {{ error }}
                </div>

                <form @submit.prevent="handleLogin" class="space-y-4">
                    <div>
                        <label class="block text-fifa-silver text-sm mb-1"
                            >Email</label
                        >
                        <input
                            v-model="email"
                            type="email"
                            required
                            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-fifa-gold focus:outline-none transition-colors"
                            placeholder="gracz@fifa.pl"
                        />
                    </div>
                    <div>
                        <label class="block text-fifa-silver text-sm mb-1"
                            >Hasło</label
                        >
                        <input
                            v-model="password"
                            type="password"
                            required
                            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-fifa-gold focus:outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        :disabled="loading"
                        class="w-full bg-fifa-gold hover:bg-fifa-gold-light text-black font-bold py-3 rounded-lg transition-colors font-fifa text-lg tracking-wide disabled:opacity-50"
                    >
                        {{ loading ? "Logowanie..." : "ZALOGUJ" }}
                    </button>
                </form>

                <p class="text-center text-gray-400 mt-4 text-sm">
                    Nie masz konta?
                    <router-link
                        to="/register"
                        class="text-fifa-gold hover:underline ml-1"
                        >Zarejestruj się</router-link
                    >
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth";

const router = useRouter();
const auth = useAuthStore();
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const handleLogin = async () => {
    error.value = "";
    loading.value = true;
    try {
        const data = await auth.login(email.value, password.value);
        router.push(data.user.role === "admin" ? "/admin" : "/squad");
    } catch (err) {
        error.value = err.response?.data?.error || "Błąd logowania";
    } finally {
        loading.value = false;
    }
};
</script>
