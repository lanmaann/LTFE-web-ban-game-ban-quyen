import type { Game, GameSystemRequirements, GameTranslation } from "../types/game";
import type { Locale } from "./I18nContext";



const GENRE_TRANSLATIONS: Record<string, Record<Locale, string>> = {
    "Action RPG": { vi: "Nhập vai hành động", en: "Action RPG" },
    "Action": { vi: "Hành động", en: "Action" },
    "RPG": { vi: "Nhập vai", en: "RPG" },
    "JRPG": { vi: "Nhập vai Nhật Bản", en: "JRPG" },
    "Adventure": { vi: "Phiêu lưu", en: "Adventure" },
    "Simulation": { vi: "Mô phỏng", en: "Simulation" },
    "Strategy": { vi: "Chiến thuật", en: "Strategy" },
    "Survival": { vi: "Sinh tồn", en: "Survival" },
    "Puzzle": { vi: "Giải đố", en: "Puzzle" },
    "Platformer": { vi: "Đi cảnh", en: "Platformer" },
    "Sandbox": { vi: "Thế giới mở", en: "Sandbox" },
    "MOBA": { vi: "MOBA", en: "MOBA" },
    "FPS": { vi: "Bắn súng góc nhìn thứ nhất", en: "FPS" },
    "Battle Royale": { vi: "Sinh tồn chiến đấu", en: "Battle Royale" },
    "Co-op": { vi: "Hợp tác", en: "Co-op" },
    "Roguelike": { vi: "Roguelike", en: "Roguelike" },
};

const EN_PRODUCT_FALLBACKS: Record<string, Pick<GameTranslation, "description" | "promotionText">> = {
    "1245620": {
        description: "Crafted by FromSoftware and George R.R. Martin, Elden Ring takes players to the mysterious and shattered Lands Between. Step into the role of the Tarnished and explore dark dungeons, snow-capped peaks, and grand ancient castles while facing formidable Demigods in breathtaking combat.",
        promotionText: "Best-selling RPG Deal",
    },
    "413150": {
        description: "Inheriting your grandfather's old farm plot in Stardew Valley, you leave behind city life to start a peaceful farming journey. Grow seasonal crops, raise animals, mine deep caverns, and befriend over 30 townsfolk in Pelican Town.",
        promotionText: "Cozy Indie Favorite",
    },
    "1091500": {
        description: "Set in the neon-lit megalopolis of Night City, play as V, an outlaw mercenary chasing a one-of-a-kind implant that holds the key to immortality. Customize your cyberware, combat style, and shape a branching story alongside Johnny Silverhand.",
        promotionText: "Night City Special Offer",
    },
    "1086940": {
        description: "Winner of Game of the Year 2023, Baldur's Gate 3 is a next-generation RPG built on the classic Dungeons & Dragons ruleset. Gather a diverse party and embark on an epic tale across the Forgotten Realms where every roll and choice matters.",
        promotionText: "Game of the Year Edition",
    },
    "1174180": {
        description: "America, 1899. Follow Arthur Morgan and the Van der Linde gang as outlaws on the run from federal agents across the rugged heartland. Hunt, rob, and experience an unforgettable story of loyalty and survival.",
    },
    "292030": {
        description: "Become Geralt of Rivia, a monster slayer for hire, in a war-torn fantasy world. Track down the Child of Prophecy across vast open regions filled with merchant cities, pirate islands, and forgotten ruins.",
    },
    "990080": {
        description: "Experience Hogwarts in the 1800s as a student holding the key to an ancient secret. Cast spells, brew potions, tame magical beasts, and explore iconic locations in an immersive open-world action RPG.",
    },
    "1145360": {
        description: "Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler from the creators of Bastion and Transistor.",
    },
    "504230": {
        description: "Help Madeline survive her inner demons on her journey to the top of Celeste Mountain in this tight, hand-crafted precision platformer with over 700 screens of challenge.",
    },
    "105600": {
        description: "Dig, fight, explore, build! Nothing is impossible in this action-packed 2D sandbox adventure where the world is your canvas.",
    },
    "550": {
        description: "Set in the zombie apocalypse, Left 4 Dead 2 is a cooperative action horror FPS taking you and your friends through cities, swamps, and cemeteries across five expansive campaigns.",
    },
    "620": {
        description: "Return to Aperture Science Laboratories in this acclaimed first-person puzzle-platformer featuring mind-bending portal mechanics, co-op campaigns, and iconic humor.",
    },
    "271590": {
        description: "Experience Rockstar's critically acclaimed open world of Los Santos and Blaine County with three interconnected protagonists and endless online action.",
    },
    "230410": {
        description: "Awaken as an unstoppable warrior and battle alongside friends in this story-driven free-to-play online action game across a sprawling sci-fi Origin System.",
    },
    "570": {
        description: "Every day, millions of players worldwide enter battle as one of over a hundred Dota heroes in the deepest competitive 5v5 MOBA arena.",
    },
    "730": {
        description: "The next era of Counter-Strike arrives with upgraded maps, responsive smoke grenades, and precision competitive tactical FPS gameplay.",
    },
    "1172470": {
        description: "Master an ever-growing roster of legendary characters with powerful abilities in this fast-paced squad-based Battle Royale shooter.",
    },
    "1623730": {
        description: "Fight, farm, build, and work alongside mysterious creatures called Pals in this massive multiplayer open-world survival and crafting game.",
    },
    "1966720": {
        description: "A co-op horror scavenging game about collecting scrap from abandoned, industrialized moons to meet the Company's profit quota before night falls.",
    },
    "2358720": {
        description: "Rooted in Chinese mythology and Journey to the West, set out as the Destined One to confront legends, master staff combat, and uncover hidden truths.",
        promotionText: "Hot Action RPG",
    },
    "427520": {
        description: "Build and maintain automated factories, mine resources, research technologies, and defend your industrial empire on an alien planet.",
    },
    "255710": {
        description: "A modern take on the classic city simulation where you design roads, manage public services, and grow a bustling metropolis.",
    },
    "1222670": {
        description: "Unleash your imagination and create a unique world of Sims that's an expression of you. Customize appearances, build dream homes, and guide their lives.",
    },
    "8930": {
        description: "Create, discover, and download new maps and scenarios as you lead a civilization from the dawn of man into the space age.",
    },
    "1817070": {
        description: "Swing through Marvel's New York as an experienced Peter Parker fighting big crime and iconic villains in an acclaimed PC-optimized action adventure.",
    },
    "1462040": {
        description: "A spectacular reimagining of the iconic RPG classic, featuring enhanced visuals, hybrid real-time/tactical combat, and the EPISODE INTERmission expansion.",
    },
    "250900": {
        description: "A randomly generated action RPG shooter with heavy roguelike elements, hundreds of items, and endless replayability.",
    },
    "1328670": {
        description: "Relive the legend of Commander Shepard in the critically acclaimed Mass Effect trilogy, remastered and optimized for modern PCs with all DLC included.",
    },
    "1151640": {
        description: "Experience Aloy's legendary quest to unravel the mysteries of a world ruled by deadly Machines in this complete edition including The Frozen Wilds.",
    },
    "42700": {
        description: "The iconic first-person shooter returns with an intense single-player campaign, Special Ops co-op missions, and classic multiplayer.",
    },
    "413080": {
        description: "The RPG game where you don't have to destroy anyone. Befriend or spare unforgettable monsters in a charming underground world.",
    },
};

export interface LocalizedGameData {
    title: string;
    description: string;
    genre: string;
    publisher: string;
    promotionText: string | null;
    systemRequirements: {
        minimum: GameSystemRequirements;
        recommended?: GameSystemRequirements;
    };
}

export function getLocalizedGenre(genre: string, locale: Locale): string {
    if (!genre) return "";
    return GENRE_TRANSLATIONS[genre]?.[locale] ?? genre;
}

export function getDefaultSystemRequirements(locale: Locale): {
    minimum: GameSystemRequirements;
    recommended: GameSystemRequirements;
} {
    if (locale === "vi") {
        return {
            minimum: {
                os: "Windows 10 64-bit",
                processor: "Intel Core i5-8400 / AMD Ryzen 3 3300X",
                memory: "8 GB RAM",
                graphics: "NVIDIA GTX 1060 3GB / AMD Radeon RX 580 4GB",
                storage: "50 GB dung lượng trống",
            },
            recommended: {
                os: "Windows 10/11 64-bit",
                processor: "Intel Core i7-10700K / AMD Ryzen 5 5600X",
                memory: "16 GB RAM",
                graphics: "NVIDIA RTX 3060 / AMD Radeon RX 6700 XT",
                storage: "50 GB SSD dung lượng trống",
            },
        };
    }

    return {
        minimum: {
            os: "Windows 10 64-bit",
            processor: "Intel Core i5-8400 / AMD Ryzen 3 3300X",
            memory: "8 GB RAM",
            graphics: "NVIDIA GTX 1060 3GB / AMD Radeon RX 580 4GB",
            storage: "50 GB available space",
        },
        recommended: {
            os: "Windows 10/11 64-bit",
            processor: "Intel Core i7-10700K / AMD Ryzen 5 5600X",
            memory: "16 GB RAM",
            graphics: "NVIDIA RTX 3060 / AMD Radeon RX 6700 XT",
            storage: "50 GB SSD available space",
        },
    };
}

export function getLocalizedGame(game: Game, locale: Locale): LocalizedGameData {
    const trans = game.translations?.[locale];
    const enFallback = locale === "en" ? EN_PRODUCT_FALLBACKS[game.id] : undefined;
    const defaultReqs = getDefaultSystemRequirements(locale);

    const promoFromDiscount =
        game.discountPercent > 0
            ? locale === "vi"
                ? `Ưu đãi giảm ${game.discountPercent}%`
                : `Save ${game.discountPercent}%`
            : null;

    return {
        title: trans?.title || game.title,
        description: trans?.description || enFallback?.description || game.description,
        genre: trans?.genre || getLocalizedGenre(game.genre, locale),
        publisher: trans?.publisher || game.publisher || game.developer,
        promotionText:
            trans?.promotionText ||
            enFallback?.promotionText ||
            game.promotionText ||
            promoFromDiscount,
        systemRequirements: {
            minimum:
                trans?.systemRequirements?.minimum ||
                game.systemRequirements?.minimum ||
                defaultReqs.minimum,
            recommended:
                trans?.systemRequirements?.recommended ||
                game.systemRequirements?.recommended ||
                defaultReqs.recommended,
        },
    };
}
