import { db } from "../connections.ts";
import { games, gameItems } from "./schema.ts";
import { nanoid } from "nanoid";

const SYSTEM_USER_ID = "5MY0xMAZoDG64T8OCt5fhhBmbwakg3m0";
const S3_BASE_URL = "https://whos-that.s3.amazonaws.com/premadeGames/public";

const presidentsData = {
    "Abraham Lincoln": "Abraham_Lincoln.jpg",
    "Andrew Jackson": "Andrew_Jackson.jpg",
    "Barack Obama": "Barack_Obama.jpg",
    "Bill Clinton": "Bill_Clinton.jpg",
    "Donald J Trump": "Donald_J_Trump.jpg",
    "Dwight D Eisenhower": "Dwight_D_Eisenhower.jpg",
    "Franklin D Roosevelt": "Franklin_D_Roosevelt.jpg",
    "George H W Bush": "George_H_W_Bush.jpg",
    "George W Bush": "George_W_Bush.jpeg",
    "George Washington": "George_Washington.jpg",
    "Harry Truman": "Harry_Truman.jpg",
    "James Madison": "James_Madison.jpg",
    "Jimmy Carter": "Jimmy_Carter.jpg",
    "Joe Biden": "Joe_Biden.jpg",
    "John F Kennedy": "John_F_Kennedy.jpg",
    "Lyndon B Johnson": "Lyndon_B_Johnson.jpg",
    "Richard Nixon": "Richard_Nixon.jpg",
    "Ronald Reagan": "Ronald_Reagan.jpg",
    "Theodore Roosevelt": "Theodore_Roosevelt.jpg",
    "Thomas Jefferson": "Thomas_Jefferson.jpg",
    "Ulysses S. Grant": "Ulysses_S._Grant.jpg",
    "Woodrow Wilson": "Woodrow_Wilson.jpg",
};

const catsData = {
    Alfred: "Alfred.jpg",
    Bella: "Bella.jpg",
    Dawn: "Dawn.jpg",
    Garfield: "Garfield.jpg",
    Garfunkel: "Garfunkel.jpg",
    Leo: "Leo.jpg",
    Luna: "Luna.jpg",
    Max: "Max.jpg",
    Mittens: "Mittens.jpg",
    Mochi: "Mochi.jpg",
    Nala: "Nala.jpg",
    Oreo: "Oreo.jpg",
    Quinn: "Quinn.jpg",
    Sebastian: "Sebastian.jpg",
    Shade: "Shade.jpg",
    Simon: "Simon.jpg",
    Sky: "Sky.jpg",
    Sphynx: "Sphynx.webp",
    Tao: "Tao.jpg",
    Thomas: "Thomas.jpg",
    Twitch: "Twitch.jpg",
    Whiskers: "Whiskers.jpg",
};

interface GameConfig {
    title: string;
    description: string;
    folderName: string;
    data: Record<string, string>;
}

const gameConfigurations: GameConfig[] = [
    {
        title: "American Presidents",
        description:
            "Who's that with some of the most iconic and recognizable presidents of the USA.",
        folderName: "presidents",
        data: presidentsData,
    },
    {
        title: "Cats",
        description: "Who's that with cute cats :3",
        folderName: "cats",
        data: catsData,
    },
];

function generateGameItems(gameId: string, folderName: string, items: Record<string, string>) {
    return Object.entries(items).map(([name, fileName], index) => ({
        id: nanoid(),
        gameId,
        imageUrl: `${S3_BASE_URL}/${folderName}/${fileName}`,
        name,
        orderIndex: index,
    }));
}

export async function seedPremadeGames() {
    console.log("Starting premade games seeding...");

    try {
        for (const gameDefinition of gameConfigurations) {
            await db.transaction(async (tx) => {
                const gameId = nanoid();

                // Insert game record
                await tx.insert(games).values({
                    id: gameId,
                    title: gameDefinition.title,
                    description: gameDefinition.description,
                    isPublic: true,
                    userId: SYSTEM_USER_ID,
                });

                // Generate and insert game items
                const gameItemsData = generateGameItems(
                    gameId,
                    gameDefinition.folderName,
                    gameDefinition.data
                );

                await tx.insert(gameItems).values(gameItemsData);

                console.log(
                    `✅ Created game: ${gameDefinition.title} with ${gameItemsData.length} items`
                );
            });
        }

        console.log("🎉 Premade games seeding completed successfully!");
    } catch (error) {
        console.error("❌ Error seeding premade games:", error);
        throw error;
    }
}
