import { api } from "./api";
import type { GameQuestion } from "../types/question";

const STORAGE_KEY = "ata_game_questions";

function readLocal(): GameQuestion[] {
    try {
        const data: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
        return Array.isArray(data) ? data as GameQuestion[] : [];
    } catch {
        return [];
    }
}

function writeLocal(items: GameQuestion[]) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Keep the API result usable when storage is unavailable. */ }
}

export const questionService = {
    async getByGame(gameId: string): Promise<GameQuestion[]> {
        const local = readLocal().filter((item) => item.gameId === gameId);
        try {
            const response = await api.get<GameQuestion[]>("/questions", { params: { gameId } });
            const merged = new Map<string, GameQuestion>();
            local.forEach((item) => merged.set(item.id, item));
            (Array.isArray(response.data) ? response.data : []).forEach((item) => merged.set(item.id, item));
            const result = Array.from(merged.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            writeLocal([...readLocal().filter((item) => item.gameId !== gameId), ...result]);
            return result;
        } catch {
            return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }
    },

    async create(gameId: string, userId: string, userName: string, content: string): Promise<GameQuestion> {
        const question: GameQuestion = {
            id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            gameId, userId, userName, content: content.trim(), createdAt: new Date().toISOString(),
        };
        try {
            const response = await api.post<GameQuestion>("/questions", question);
            if (response.data) {
                writeLocal([response.data, ...readLocal().filter((item) => item.id !== response.data.id)]);
                return response.data;
            }
        } catch { /* Local fallback keeps the question available in this browser. */ }
        writeLocal([question, ...readLocal()]);
        return question;
    },
};
