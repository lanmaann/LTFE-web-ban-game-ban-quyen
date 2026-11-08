import { loadFromStorage, saveToStorage } from "./storage";

const SEARCH_HISTORY_KEY = "ata_games_search_history";
const MAX_HISTORY_ITEMS = 8;
const EVENT_NAME = "ata_search_history_change";

export function getSearchHistory(): string[] {
    return loadFromStorage<string[]>(SEARCH_HISTORY_KEY, []);
}

export function addSearchHistory(term: string): string[] {
    const trimmed = term.trim();
    if (!trimmed) return getSearchHistory();

    const current = getSearchHistory();
    const filtered = current.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    saveToStorage(SEARCH_HISTORY_KEY, updated);
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(EVENT_NAME));
    }
    return updated;
}

export function removeSearchHistoryItem(term: string): string[] {
    const current = getSearchHistory();
    const updated = current.filter(
        (item) => item.toLowerCase() !== term.toLowerCase()
    );
    saveToStorage(SEARCH_HISTORY_KEY, updated);
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(EVENT_NAME));
    }
    return updated;
}

export function clearSearchHistory(): void {
    saveToStorage(SEARCH_HISTORY_KEY, []);
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(EVENT_NAME));
    }
}

export function onSearchHistoryChange(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
}
