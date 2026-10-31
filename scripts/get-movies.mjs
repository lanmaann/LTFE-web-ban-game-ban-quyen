import { readFile, writeFile } from "node:fs/promises";

const db = JSON.parse(await readFile("data/db.json", "utf-8"));
const map = {};

for (const game of db.games) {
    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const url = "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://store.steampowered.com/api/appdetails?appids=" + game.id);
            const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
            const text = await res.text();
            const data = JSON.parse(text);
            const app = data[game.id]?.data;
            if (app?.movies && app.movies.length > 0) {
                const m = app.movies[0];
                map[game.id] = {
                    title: game.title,
                    movieId: m.id,
                    movieName: m.name,
                    mp4_480: m.mp4?.["480"] || `https://cdn.cloudflare.steamstatic.com/steam/apps/${m.id}/movie480.mp4`,
                    mp4_max: m.mp4?.max || `https://cdn.cloudflare.steamstatic.com/steam/apps/${m.id}/movie_max.mp4`,
                    thumbnail: m.thumbnail
                };
                console.log(`[OK] ${game.id} - ${game.title} -> ${m.id} (${m.name})`);
                success = true;
                break;
            } else {
                console.log(`[NO MOVIES] ${game.id} - ${game.title}`);
                map[game.id] = { title: game.title, noMovies: true };
                success = true;
                break;
            }
        } catch (e) {
            console.log(`[RETRY ${attempt + 1}] ${game.id} - ${e.message}`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    if (!success) {
        console.log(`[FAILED] ${game.id}`);
    }
    await new Promise(r => setTimeout(r, 600));
}

await writeFile("scripts/steam-movies.json", JSON.stringify(map, null, 2), "utf-8");
console.log("Done! Written to scripts/steam-movies.json");
