import {GAME_TIME, GAMES, io, PLAYER_MAP, STATS} from "./server";
import { Chess } from "chess.js";
import dotenv from "dotenv";
import { Game, Job } from "./types";
import { SimpleQueue } from "./simpleQueue";

dotenv.config();

const gameQueue = new SimpleQueue("gameQueue", async (job: Job) => {
  // @ts-ignore
  const { playerId } = job.job;
  console.log(`[START] Processing job for playerId: ${playerId}`);

  
  if (gameQueue.queue.length > 0) {
    const nextJob = await gameQueue.pop(); 
    // @ts-ignore
    const { playerId: nextPlayerId } = nextJob.job;

    console.log(`[MATCH] Matching ${playerId} with ${nextPlayerId}`);

    
    if (playerId === nextPlayerId) {
      console.log(`[NO MATCH] Player cannot match with themselves: ${playerId}`);
      await gameQueue.add({playerId:playerId})
      return;  
    }

    const roomId = await getRandomId(9);
    const newGame: Game = {
      gameId: roomId,
      players: [
        { socketId: PLAYER_MAP[playerId], color: "w", playerId },
        { socketId: PLAYER_MAP[nextPlayerId], color: "b", playerId: nextPlayerId },
      ],
      game: new Chess(),
      moves: [],
      turn: "w",
      timestamps: {
        blackTime: GAME_TIME,
        whiteTime: GAME_TIME,
      },
    };

    GAMES.push(newGame);
    console.log(`[GAME CREATED] Game between ${playerId} and ${nextPlayerId}`);

    // Notify both players
    if (PLAYER_MAP[playerId]) {
      io.to(PLAYER_MAP[playerId]).emit("game-created", { roomId, opponent: nextPlayerId });
    }
    if (PLAYER_MAP[nextPlayerId]) {
      io.to(PLAYER_MAP[nextPlayerId]).emit("game-created", { roomId, opponent: playerId });
    }
  } else {
    console.log(`[NO MATCH] No players to match.`);
    await gameQueue.add({playerId:playerId})
    gameQueue.isProcessing = false;
  }

  console.log(`[END] Finished processing for playerId: ${playerId}`);
});

async function getRandomId(length: number): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export { gameQueue };
