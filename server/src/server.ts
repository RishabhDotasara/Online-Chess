import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { Chess } from "chess.js";
import { createClient } from "redis";
import { gameQueue } from "./creationQueue";
import { Game, Stats, Player, CustomSocket } from "./types";
import { handleGame } from "./gameSocket";

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"], // Replace with your frontend URL
  },
});

// Socket ID is the player Id after all; just the name not changed yet

export let GAMES: Game[] = [];
export const GAME_TIME = 600; // 10 mins in secs
export const STATS: Stats = {
  online_players: 0,
  matchmaking: 0,
  games_in_progress: 0,
};

// Map for player to his
export const PLAYER_MAP: { [key: string]: string } = {};
export const PLAYER_DATA: { [key: string]: {} } = {};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("server running");
});

// Create a new game room
app.post("/find-match", async (req, res) => {
  try {
    const body: { playerId: string } = req.body;

    // Log the incoming request for better debugging
    console.log(
      `[${new Date().toISOString()}] Received match request for player ID: ${
        body.playerId
      }`
    );

    const jobExists = false;

    if (!jobExists) {
      await gameQueue.add({ playerId: body.playerId });
      console.log(
        `[${new Date().toISOString()}] Player ID ${
          body.playerId
        } added to the queue.`,
        gameQueue.queue
      );
    } else {
      console.log(
        `[${new Date().toISOString()}] Player ID ${
          body.playerId
        } is already in the queue.`
      );
    }

    // Update stats and emit to clients
    const newStats: Stats = {
      games_in_progress: STATS.games_in_progress,
      matchmaking: STATS.matchmaking + 1,
      online_players: STATS.online_players,
    };
    io.emit("update-stats", newStats);

    // Respond with success message
    res.status(200).json({ message: "Successfully added to queue!" });
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] [ERROR]: ${err.message}`); // Detailed error logging
    res.status(500).json({ message: "Error on server, try again!" });
  }
});

app.get("/replay/:id", async (req, res) => {
  const gameId = req.params.id;
  console.log("[REPLAY] ROOM:" + gameId);
  const game = GAMES.find((game: Game) => game.gameId == gameId);

  if (game) {
    res.status(200).json({ message: "SUCCESS", moves: game?.moves });
  } else {
    res.status(500).json({ message: "GAME NOT EXIST" });
  }
});

app.post("/get-username", async (req, res) => {
  try {
    console.log("Username REquest")
    const body = req.body;
    if (body.username in PLAYER_MAP) {
      res.status(500).json({ message: "Username Taken!" });
    }
    else 
    {
      res.status(200).json({ username: body.username });
    }
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] [ERROR]: ${err.message}`);
    res.status(500).json({ message: "Error on server, try again!" });
  }
});

// Socket.IO connection handler
//this should be the custom socket btw, but puts any for now.
io.on("connection", (socket:any) => {
  console.log("A user connected:", socket.id);
  STATS.online_players += 1;

  // Map the data
  socket.on("map-data", (data: { playerId: string; user: {} }) => {
    PLAYER_MAP[data.playerId] = socket.id;
    PLAYER_DATA[socket.id] = data.user;
    console.log(
      `Player ${data.playerId} registered with socket ID ${socket.id}`
    );
    (socket as CustomSocket).username = data.playerId;
    console.log(PLAYER_MAP);
    io.emit("update-stats", {
      online_players: STATS.online_players,
      matchmaking: STATS.matchmaking,
      games_in_progress: STATS.games_in_progress,
    });
  });

  //handle game events
  handleGame(socket);

  socket.on("get-online-users", ()=>{
    console.log("Online Users equest.")
    socket.emit("online-users", PLAYER_DATA);
  })

  // Handle player disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    STATS.online_players -= 1;

    //remove from the PLAYER_MAPS
    // delete PLAYER_MAP[socket.username];
    // delete PLAYER_DATA[socket.id];


    io.emit("update-stats", {
      online_players: STATS.online_players,
      matchmaking: STATS.matchmaking,
      games_in_progress: STATS.games_in_progress,
    });

    const game: Game | undefined = GAMES.find((game: Game) =>
      game.players?.some((player: Player) => player.socketId === socket.id)
    );

    if (game) {
      game.players = game.players.filter(
        (player: Player) => player.socketId !== socket.id
      );
      console.log(
        `Player with socket ID ${socket.id} removed from game ${game.gameId}`
      );

      if (game.players?.length === 0) {
        console.log(
          `No players left in game ${game.gameId}. Game is stopping.`
        );
        console.log(GAMES);
      }
    } else {
      console.log(`Game for socket ID ${socket.id} not found.`);
    }
  });
});

// Start the server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
