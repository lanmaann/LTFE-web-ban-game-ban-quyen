import { api } from "./api";
import type { Game } from "../types/game";

export const gameService = {
    async getAll(): Promise<Game[]> {
        const response = await api.get<Game[]>("/games");
        return response.data;
    },

    async getById(id: string): Promise<Game> {
        const response = await api.get<Game>(`/games/${id}`);
        return response.data;
    },
};