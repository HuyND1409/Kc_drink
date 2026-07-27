import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { me } from "@/api/auth";
import type { User } from "@/types/user";
export const useAuthStore = defineStore("auth", () => {
    const token = ref<string | null>(
        sessionStorage.getItem("token")
    );
const user = ref<User | null>(
    JSON.parse(sessionStorage.getItem("user") || "null")
);
    const isLogin = computed(() => token.value !== null);
    function setToken(jwt: string) {
        token.value = jwt;
        sessionStorage.setItem("token", jwt);

    }

   function setUser(data: User) {

        user.value = data;

        sessionStorage.setItem(
            "user",
            JSON.stringify(data)
        );
    }
    async function fetchMe() {

        const response = await me();

        setUser(response.data.data);

    }

    function logout() {

        token.value = null;

        user.value = null;

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

    }

    return {

        token,

        user,

        isLogin,

        setToken,

        setUser,

        fetchMe,

        logout

    };

});
