// Tải ảnh game từ internet về public/images/games và sửa db.json trỏ vào ảnh nội bộ.
// Chạy: npm run images   (cần Node 18 trở lên và máy phải vào được steamstatic.com)
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(root, "data", "db.json");
const outDir = path.join(root, "public", "images", "games");
const FIELDS = { coverImage: "cover", bannerImage: "banner" };

const db = JSON.parse(await readFile(dbPath, "utf-8"));
await mkdir(outDir, { recursive: true });
await copyFile(dbPath, dbPath + ".bak"); // sao lưu trước khi sửa

let ok = 0;
const failed = [];

for (const game of db.games) {
    for (const [field, suffix] of Object.entries(FIELDS)) {
        const url = game[field];
        if (typeof url !== "string" || !url.startsWith("http")) continue; // đã là ảnh nội bộ

        const ext = path.extname(new URL(url).pathname) || ".jpg";
        const fileName = `${game.id}-${suffix}${ext}`;
        const filePath = path.join(outDir, fileName);

        try {
            if (!existsSync(filePath)) {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                await writeFile(filePath, Buffer.from(await res.arrayBuffer()));
            }
            game[field] = `/images/games/${fileName}`;
            ok++;
            console.log(`OK    ${fileName}`);
        } catch (error) {
            failed.push(`${game.id} ${field}: ${error.message}`);
            console.log(`LỖI   ${fileName} (${error.message})`);
        }
    }
}

await writeFile(dbPath, JSON.stringify(db, null, 2) + "\n", "utf-8");
console.log(`\nXong: ${ok} ảnh đã lưu, ${failed.length} ảnh lỗi (giữ nguyên link cũ).`);
if (failed.length) console.log("Chạy lại lệnh để thử tải tiếp các ảnh lỗi.");
