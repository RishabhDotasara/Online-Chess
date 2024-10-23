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
exports.PLAYER_DATA = exports.PLAYER_MAP = exports.STATS = exports.GAME_TIME = exports.GAMES = exports.GAME_END_TYPE = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const creationQueue_1 = require("./creationQueue");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://192.168.32.91:3000", // Replace with your frontend URL
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    },
});
var GAME_END_TYPE;
(function (GAME_END_TYPE) {
    GAME_END_TYPE[GAME_END_TYPE["RESIGN"] = 0] = "RESIGN";
    GAME_END_TYPE[GAME_END_TYPE["DRAW"] = 1] = "DRAW";
    GAME_END_TYPE[GAME_END_TYPE["STALEMATE"] = 2] = "STALEMATE";
    GAME_END_TYPE[GAME_END_TYPE["CHECKMATE"] = 3] = "CHECKMATE";
    GAME_END_TYPE[GAME_END_TYPE["AUTO_DRAW"] = 4] = "AUTO_DRAW";
})(GAME_END_TYPE || (exports.GAME_END_TYPE = GAME_END_TYPE = {}));
exports.GAMES = [];
exports.GAME_TIME = 600; // 10 mins in secs
exports.STATS = {
    online_players: 0,
    matchmaking: 0,
    games_in_progress: 0,
};
// Map for player to their socket ID
exports.PLAYER_MAP = {};
exports.PLAYER_DATA = {};
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
// Utility function for logging
const log = (message) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
};
app.get("/", (req, res) => {
    res.send("Socket.IO server running");
});
// Create a new game room
app.post("/find-match", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        yield creationQueue_1.gameQueue.add({ playerId: body.playerId });
        const isPaused = yield creationQueue_1.gameQueue.isPaused();
        if (isPaused) {
            yield creationQueue_1.gameQueue.resume();
        }
        const newStats = {
            games_in_progress: exports.STATS.games_in_progress,
            matchmaking: exports.STATS.matchmaking + 1,
            online_players: exports.STATS.online_players,
        };
        exports.io.emit("update-stats", newStats);
        res.status(200).json({ message: "Successfully added to queue!" });
        log(`PLAYER ${body.playerId} ADDED TO QUEUE`);
    }
    catch (err) {
        console.error(`[${new Date().toISOString()}] ERROR IN /find-match:`, err);
        res.status(500).json({ message: "Error adding player to queue. Please try again." });
    }
}));
app.get("/replay/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gameId = req.params.id;
    log(`REPLAY REQUEST FOR ROOM: ${gameId}`);
    const game = exports.GAMES.find((game) => game.gameId === gameId);
    if (game) {
        res.status(200).json({ message: "SUCCESS", moves: game === null || game === void 0 ? void 0 : game.moves });
        log(`REPLAY SUCCESS FOR GAME: ${gameId}`);
    }
    else {
        res.status(500).json({ message: "GAME DOES NOT EXIST" });
        log(`REPLAY FAILED - GAME ${gameId} NOT FOUND`);
    }
}));
// Socket.IO connection handler
exports.io.on("connection", (socket) => {
    log(`USER CONNECTED: SOCKET ID ${socket.id}`);
    exports.STATS.online_players += 1;
    socket.on("map-data", (data) => {
        exports.PLAYER_MAP[data.playerId] = socket.id;
        exports.PLAYER_DATA[socket.id] = data.user;
        log(`PLAYER ${data.playerId} MAPPED WITH SOCKET ID ${socket.id}`);
        exports.io.emit("update-stats", {
            online_players: exports.STATS.online_players,
            matchmaking: exports.STATS.matchmaking,
            games_in_progress: exports.STATS.games_in_progress,
        });
    });
    // Handle room join event
    socket.on("join-room", (data) => {
        var _a;
        try {
            log(`JOIN REQUEST FOR ROOM ID: ${data.gameID}`);
            const game = exports.GAMES.find((game) => game.gameId === data.gameID);
            if (!game) {
                return socket.emit("error", { message: "Game not found!" });
            }
            socket.join(game.gameId);
            socket.emit("handshake-done", {
                color: (_a = game.players.find((player) => player.socketId === socket.id)) === null || _a === void 0 ? void 0 : _a.color,
                position: game === null || game === void 0 ? void 0 : game.game.fen(),
            });
            log(`PLAYER JOINED ROOM: ${data.gameID}`);
        }
        catch (err) {
            console.error(`[${new Date().toISOString()}] ERROR IN JOIN-ROOM:`, err);
            socket.emit("error", { message: "Failed to join room!" });
        }
    });
    // Game events - Make move
    socket.on("make-move", (data) => {
        try {
            const game = exports.GAMES.find((game) => game.gameId === data.roomId);
            if (!game) {
                return socket.emit("error", { message: "Game not found!" });
            }
            if (data.color !== (game === null || game === void 0 ? void 0 : game.game.turn())) {
                return socket.emit("error", { message: "It's not your turn!" });
            }
            const move = game === null || game === void 0 ? void 0 : game.game.move({ from: data.from, to: data.to });
            if (!move) {
                return socket.emit("invalid-move", { message: "Invalid move!" });
            }
            // Push move to the moves array for replay
            game.moves.push(game.game.fen());
            const newFEN = game === null || game === void 0 ? void 0 : game.game.fen();
            // Update time
            if (data.color === "w") {
                game.timestamps.whiteTime = data.time;
            }
            else {
                game.timestamps.blackTime = data.time;
            }
            // Check game end conditions
            if (game.game.isCheckmate()) {
                exports.io.to(data.roomId).emit("game-over", {
                    result: GAME_END_TYPE.CHECKMATE,
                    winner: data.color,
                });
            }
            else if (game.game.isStalemate()) {
                exports.io.to(data.roomId).emit("game-over", {
                    result: GAME_END_TYPE.STALEMATE,
                });
            }
            else if (game.game.isDraw()) {
                exports.io.to(data.roomId).emit("game-over", {
                    result: GAME_END_TYPE.AUTO_DRAW,
                });
            }
            else {
                exports.io.to(data.roomId).emit("position-change", { newFEN, time: game.timestamps });
            }
        }
        catch (err) {
            console.error(`[${new Date().toISOString()}] ERROR IN MAKE-MOVE:`, err);
            socket.emit("error", { message: "Error processing move!" });
        }
    });
    // Game start event
    socket.on("start-game", (data) => {
        exports.io.to(data.gameId).emit("game-started");
        log(`GAME STARTED: GAME ID ${data.gameId}`);
    });
    // Resign event for the game
    socket.on("resign", (data) => {
        try {
            log(`RESIGN REQUEST FOR GAME ${data.gameId} BY PLAYER ${data.playerColor}`);
            exports.io.to(data.gameId).emit("game-over", {
                result: GAME_END_TYPE.RESIGN,
                winner: data.playerColor === "w" ? "b" : "w",
            });
        }
        catch (err) {
            console.error(`[${new Date().toISOString()}] ERROR IN RESIGN:`, err);
            socket.emit("error", { message: "Error processing resignation." });
        }
    });
    // Draw request
    socket.on("draw", (data) => {
        var _a;
        try {
            const game = exports.GAMES.find((game) => game.gameId === data.gameId);
            const playerToAsk = (_a = game === null || game === void 0 ? void 0 : game.players.find((player) => player.socketId !== socket.id)) === null || _a === void 0 ? void 0 : _a.socketId;
            exports.io.to(playerToAsk).emit("alert", { type: GAME_END_TYPE.DRAW });
            socket.on("draw-answer", (data) => {
                exports.io.to(socket.id).emit("draw-response", data);
            });
            log(`DRAW REQUEST SENT TO PLAYER IN GAME ${data.gameId}`);
        }
        catch (err) {
            console.error(`[${new Date().toISOString()}] ERROR IN DRAW REQUEST:`, err);
            socket.emit("error", { message: "Error processing draw request." });
        }
    });
    // Handle player disconnection
    socket.on("disconnect", () => {
        exports.STATS.online_players -= 1;
        log(`USER DISCONNECTED: SOCKET ID ${socket.id}`);
        exports.io.emit("update-stats", {
            online_players: exports.STATS.online_players,
            matchmaking: exports.STATS.matchmaking,
            games_in_progress: exports.STATS.games_in_progress,
        });
    });
});
// Global error handling for unknown routes
app.use((req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
    log(`404 - UNKNOWN ROUTE REQUESTED: ${req.url}`);
});
const PORT = 4000;
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    log(`SERVER STARTED ON PORT ${PORT}`);
}));
