import api from "./axios";
import type { LoginRequest, ApiResponse } from "@/types/auth";

export const login = (request: LoginRequest) => {

    return api.post<ApiResponse<string>>(
        "/auth/login",
        request
    );

};

export const me = () => {

    return api.get("/auth/me");

};