"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const server_1 = require("./server");
const chess_js_1 = require("chess.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const gameQueue = new bull_1.default("game-queue", {
    redis: {
        host: 'redis-13067.c330.asia-south1-1.gce.redns.redis-cloud.com',
        port: 13067,
        password: 'tILQgdfjIVpjPPoWI7KnYfKHNkyyX6MA'
    }
});
exports.gameQueue = gameQueue;
gameQueue.empty().then(() => {
    console.log("Game Queue Cleared!");
});
// Utility function to generate random ID
const getRandomId = (length) => __awaiter(void 0, void 0, void 0, function* () {
    let id = "";
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    for (let i = 0; i < length; i++) {
        id += letters[Math.floor(Math.random() * letters.length)];
    }
    return id;
});
gameQueue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const waitingJobs = yield gameQueue.getWaiting();
        const delayedJobs = yield gameQueue.getDelayed();
        // console.log(waitingJobs, delayedJobs)
        const { playerId } = job.data;
        console.log("Matching ", playerId);
        const roomId = yield getRandomId(9);
        if (waitingJobs.length > 0 || delayedJobs.length > 0) {
            const nextJob = waitingJobs[0];
            const { playerId: nextPlayerId } = nextJob.data;
            const newGame = {
                gameId: roomId,
                players: [
                    { socketId: server_1.PLAYER_MAP[playerId], color: "w", playerId: playerId },
                    { socketId: server_1.PLAYER_MAP[nextPlayerId], color: "b", playerId: nextPlayerId },
                ],
                game: new chess_js_1.Chess(),
                moves: [],
                turn: "w",
                timestamps: {
                    blackTime: server_1.GAME_TIME,
                    whiteTime: server_1.GAME_TIME,
                },
            };
            server_1.GAMES.push(newGame);
            console.log("Updated GAMES array:", server_1.GAMES, newGame.players); // Add logging here
            yield nextJob.remove();
            console.log(`[GAME CREATED] between ${playerId} and ${nextPlayerId} with room ID ${roomId}`);
            if (server_1.PLAYER_MAP[playerId]) {
                server_1.io.to(server_1.PLAYER_MAP[playerId]).emit("game-created", {
                    roomId,
                    opponent: nextPlayerId,
                });
            }
            if (server_1.PLAYER_MAP[nextPlayerId]) {
                server_1.io.to(server_1.PLAYER_MAP[nextPlayerId]).emit("game-created", {
                    roomId,
                    opponent: playerId,
                });
            }
            const newStats = { online_players: server_1.STATS.online_players, games_in_progress: server_1.STATS.games_in_progress + 1, matchmaking: server_1.STATS.matchmaking - 2 };
            server_1.io.emit('update-stats', newStats);
        }
        else {
            console.log("No Players To Match.");
            // await gameQueue.add({ playerId }, { delay: 3000 });
            // await job.retry()
            gameQueue.add({ playerId: playerId });
            yield gameQueue.pause();
        }
    }
    catch (err) {
        console.log(err);
    }
}));
gameQueue.on("failed", (job, err) => {
    console.log(`[JOB FAILED]: ${err}`);
});
// gameQueue.on("completed", (job: any) => {
//   console.log(`Job completed: ${job.id}`);
// });
gameQueue.on("error", (error) => {
    console.error("[REDIS ERROR]: ", error);
});
