
import { GAMES, io } from "./server";
import { CustomSocket, Game, GAME_END_TYPE, Player } from "./types";


export function handleGame(socket:CustomSocket)
{
    // Handle room join event
  socket.on("join-room", (data: { gameID: string }) => {
    console.log(`[JOIN REQUEST] ROOMID: ${data.gameID}`);
    const game: Game = GAMES.find(
      (game: Game) => game.gameId == data.gameID
    ) as Game;
    // console.log(game.players);
    socket.join(game.gameId);

    // Fire back the welcome event
    socket.emit("handshake-done", {
      color: game.players.find((player: Player) => player.socketId == socket.id)
        ?.color,
      position: game?.game.fen(),
      players:game.players
    });
  });

  // GAME EVENTS
  // Make move
  socket.on(
    "make-move",
    (data: {
      roomId: string;
      from: string;
      to: string;
      color: string;
      time: number;
    }) => {
      console.log(data);
      try {
        const game = GAMES.find((game: Game) => game.gameId == data.roomId);
        if (data.color != game?.game.turn()) {
          return;
        }

        // Push the last fen to the moves array to be used for replay.
        game.moves.push(game.game.fen());

        const move = game?.game.move({ from: data.from, to: data.to });

        if (move != null) {
          const newFEN = game?.game.fen();

          // Set the timestamps you got from the player
          if (game && game.timestamps) {
            if (data.color == "w") {
              game.timestamps.whiteTime = data.time;
            } else {
              game.timestamps.blackTime = data.time;
            }
          }

          // Check for game end conditions
          if (game.game.isCheckmate()) {
            io.to(data.roomId).emit("game-over", {
              result: GAME_END_TYPE.CHECKMATE,
              winner: data.color,
            });
          } else if (game?.game.isStalemate()) {
            io.to(data.roomId).emit("game-over", {
              result: GAME_END_TYPE.STALEMATE,
            });
          } else if (game?.game.isDraw()) {
            io.to(data.roomId).emit("game-over", {
              result: GAME_END_TYPE.AUTO_DRAW,
            });
          } else {
            io.to(data.roomId).emit("position-change", {
              newFEN,
              time: game?.timestamps,
            });
          }
        } else {
          socket.emit("invalid-move");
        }
      } catch (err) {
        console.log(err);
      }
    }
  );

  // Game start
  socket.on("start-game", (data: { gameId: string }) => {
    io.to(data.gameId).emit("game-started");
  });

  // Resign event for the game
  socket.on("resign", (data: { gameId: string; playerColor: string }) => {
    console.log(`[REMOVING GAME] GAME ${data.gameId} REMOVED!`);
    io.to(data.gameId).emit("alert", { type: GAME_END_TYPE.RESIGN });
  });

  // Draw
  socket.on("draw", (data: { gameId: string; playerColor: string }) => {
    const game = GAMES.find((game: Game) => game.gameId == data.gameId);
    const playerToAsk = game?.players.find(
      (player: Player) => player.socketId != socket.id
    )?.socketId as string;
    const playerWhoAsked = game?.players.find(
      (player: Player) => player.socketId == socket.id
    )?.socketId as string;
    
    io.to(playerToAsk).emit("alert", { type: GAME_END_TYPE.DRAW });
  });

  socket.on("draw-answer", (data: { answer: boolean }) => {
    console.log(data);
    const game = GAMES.find((game: Game) => game.players.some((player: Player) => player.socketId == socket.id));
    const playerWhoAsked = game?.players.find(
      (player: Player) => player.socketId != socket.id
    )?.socketId as string;
    io.to(playerWhoAsked).emit("draw-response", data);
  });

}