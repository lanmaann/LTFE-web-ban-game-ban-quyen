import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Game } from "../../types/game";
import type { RootState } from "../../app/store";
import { gameService } from "../../services/gameService";

interface GamesState {
    items: Game[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

const initialState: GamesState = {
    items: [],
    status: "idle",
    error: null,
};

export const fetchGames = createAsyncThunk("games/fetchAll", () => gameService.getAll(), {
    condition: (_, { getState }) => {
        const { status } = (getState() as RootState).games;
        return status !== "loading" && status !== "succeeded";
    },
});

const gamesSlice = createSlice({
    name: "games",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchGames.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchGames.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.items = action.payload;
            })
            .addCase(fetchGames.rejected, (state) => {
                state.status = "failed";
                state.error =
                    "Không thể tải danh sách game.";
            });
    },
});

export const selectGames = (state: RootState) => state.games.items;
export const selectGamesStatus = (state: RootState) => state.games.status;
export const selectGamesError = (state: RootState) => state.games.error;

export default gamesSlice.reducer;
