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
const redis_1 = require("redis");
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
const redisClient = (0, redis_1.createClient)({
    password: "QjGptgXC35XYv1XMQ9WxiMo34Pib03Rf",
    socket: {
        host: "redis-14055.c80.us-east-1-2.ec2.redns.redis-cloud.com",
        port: 14055,
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
exports.GAME_TIME = 600; //10 mins in secs
exports.STATS = {
    online_players: 0,
    matchmaking: 0,
    games_in_progress: 0,
};
//map for player to his
exports.PLAYER_MAP = {};
exports.PLAYER_DATA = {};
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.get("/", (req, res) => {
    res.send("Socket.IO server running");
});
// Create a new game room
app.post("/find-match", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //these typese need to be defined separately.
        const body = req.body;
        // console.log(body);
        yield creationQueue_1.gameQueue.add({
            playerId: body.playerId,
        });
        const isPaused = yield creationQueue_1.gameQueue.isPaused();
        if (isPaused) {
            creationQueue_1.gameQueue.resume();
        }
        const newStats = {
            games_in_progress: exports.STATS.games_in_progress,
            matchmaking: exports.STATS.matchmaking + 1,
            online_players: exports.STATS.online_players,
        };
        exports.io.emit("update-stats", newStats);
        res.status(200).json({ message: "Successfully added to queue!" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error On Server, Try Again!" });
    }
}));
app.get("/replay/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gameId = req.params.id;
    console.log("[REPLAY] ROOM:" + gameId);
    const game = exports.GAMES.find((game) => game.gameId == gameId);
    if (game) {
        res.status(200).json({ message: "SUCCESS", moves: game === null || game === void 0 ? void 0 : game.moves });
    }
    else {
        res.status(500).json({ message: "GAME NOT EXIST" });
    }
}));
// Socket.IO connection handler
exports.io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    exports.STATS.online_players += 1;
    //map the data
    socket.on("map-data", (data) => {
        exports.PLAYER_MAP[data.playerId] = socket.id;
        exports.PLAYER_DATA[socket.id] = data.user;
        console.log(`Player ${data.playerId} registered with socket ID ${socket.id}`);
        console.log(exports.PLAYER_MAP);
        exports.io.emit("update-stats", {
            online_players: exports.STATS.online_players,
            matchmaking: exports.STATS.matchmaking,
            games_in_progress: exports.STATS.games_in_progress,
        });
    });
    //handle room join event
    socket.on("join-room", (data) => {
        var _a;
        console.log(`[JOIN REQUEST] ROOMID: ${data.gameID}`);
        const game = exports.GAMES.find((game) => game.gameId == data.gameID);
        console.log(game.players);
        socket.join(game.gameId);
        //fire back the welcome event
        socket.emit("handshake-done", {
            color: (_a = game.players.find((player) => player.socketId == socket.id)) === null || _a === void 0 ? void 0 : _a.color,
            position: game === null || game === void 0 ? void 0 : game.game.fen(),
        });
    });
    // GAME EVENTS
    //make move
    socket.on("make-move", (data) => {
        console.log(data);
        try {
            const game = exports.GAMES.find((game) => game.gameId == data.roomId);
            if (data.color != (game === null || game === void 0 ? void 0 : game.game.turn())) {
                return;
            }
            //push the last fen to the moves array to be used for replay.
            game.moves.push(game.game.fen());
            const move = game === null || game === void 0 ? void 0 : game.game.move({
                from: data.from,
                to: data.to,
            });
            if (move != null) {
                const newFEN = game === null || game === void 0 ? void 0 : game.game.fen();
                //set the timestamps you got from the player
                if (game && game.timestamps) {
                    if (data.color == "w") {
                        game.timestamps.whiteTime = data.time;
                    }
                    else {
                        game.timestamps.blackTime = data.time;
                    }
                }
                // Check for game end conditions
                if (game.game.isCheckmate()) {
                    exports.io.to(data.roomId).emit("game-over", {
                        result: GAME_END_TYPE.CHECKMATE,
                        winner: data.color,
                    });
                }
                else if (game === null || game === void 0 ? void 0 : game.game.isStalemate()) {
                    exports.io.to(data.roomId).emit("game-over", {
                        result: GAME_END_TYPE.STALEMATE,
                    });
                }
                else if (game === null || game === void 0 ? void 0 : game.game.isDraw()) {
                    exports.io.to(data.roomId).emit("game-over", {
                        result: GAME_END_TYPE.AUTO_DRAW,
                    });
                }
                else {
                    exports.io.to(data.roomId).emit("position-change", {
                        newFEN,
                        time: game === null || game === void 0 ? void 0 : game.timestamps,
                    });
                }
            }
            else {
                socket.emit("invalid-move");
            }
        }
        catch (err) {
            console.log(err);
        }
    });
    //game-start
    socket.on("start-game", (data) => {
        exports.io.to(data.gameId).emit("game-started");
    });
    //resign event for the game
    socket.on("resign", (data) => {
        console.log(`[REMOVING GAME] GAME ${data.gameId} REMOVED!`);
        exports.io.to(data.gameId).emit("alert", { type: GAME_END_TYPE.RESIGN });
    });
    //draw
    socket.on("draw", (data) => {
        var _a;
        const game = exports.GAMES.find((game) => game.gameId == data.gameId);
        const playerToAsk = (_a = game === null || game === void 0 ? void 0 : game.players.find((player) => player.socketId != socket.id)) === null || _a === void 0 ? void 0 : _a.socketId;
        exports.io.to(playerToAsk).emit("alert", { type: GAME_END_TYPE.DRAW });
        socket.on("draw-answer", (data) => {
            console.log(data);
            exports.io.to(socket.id).emit("draw-response", data);
        });
    });
    // Handle player disconnect
    socket.on("disconnect", () => {
        var _a;
        console.log("User disconnected:", socket.id);
        exports.STATS.online_players -= 1;
        exports.io.emit("update-stats", {
            online_players: exports.STATS.online_players,
            matchmaking: exports.STATS.matchmaking,
            games_in_progress: exports.STATS.games_in_progress,
        });
        const game = exports.GAMES.find((game) => { var _a; return (_a = game.players) === null || _a === void 0 ? void 0 : _a.some((player) => player.socketId === socket.id); });
        if (game) {
            game.players = game.players.filter((player) => player.socketId !== socket.id);
            console.log(`Player with socket ID ${socket.id} removed from game ${game.gameId}`);
            if (((_a = game.players) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                console.log(`No players left in game ${game.gameId}. Game is stopping.`);
                console.log(exports.GAMES);
            }
        }
        else {
            console.log(`Game for socket ID ${socket.id} not found.`);
        }
    });
});
// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
