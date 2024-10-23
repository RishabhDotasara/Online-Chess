"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chessboard } from "react-chessboard";
import { Chess, Square } from "chess.js"; // Piece is not used
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import GameAlert from "./gameAlert";
import { GAME_END_TYPE, GAME_STATE, GameState, Player } from "@/lib/utils";
import { useRecoilState, useRecoilValue } from "recoil";
import socketAtom from "@/states/socketAtom";
import { useSocket } from "@/providers/socketProvider";
import { Avatar, AvatarFallback } from "./ui/avatar";
import ChessGameChat from "./chatComponent";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export default function ChessGameWithTimers({ id }: { id: string }) {
  const [game, setGame] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState(""); // Track player color
  const [position, setPosition] = useState(game.fen()); // Initial position in FEN
  const { toast } = useToast(); // For showing notifications
  // @ts-ignore
  const socket: Socket = useSocket(); // Store socket instance
  const router = useRouter(); // For redirecting
  const [gameState, setGameState] = useState<GameState>({
    blackTime: 600, // 10 minutes in seconds
    whiteTime: 600,
    state: GAME_STATE.NOTSTARTED,
    blackPlayer: undefined, // Added player names
    whitePlayer: undefined, // Added player names
  });
  const [alert, setAlert] = useState({
    open: false,
    type: GAME_END_TYPE.RESIGN,
  });
  const [highlightedSquares, setHighlightedSquares] = useState({});

  // Start timer for the game
  const startTimer = () => {
    if (gameState.blackTime == 0 || gameState.whiteTime == 0)
    {
      setGameState((prev)=>{
        return {...prev, state:GAME_STATE.OUT_OF_TIME}
      })

    }
    const interval = setInterval(() => {
      setGameState((prev) => {
        if (game.turn() === "b") {
          return { ...prev, blackTime: prev.blackTime - 1 };
        } else {
          return { ...prev, whiteTime: prev.whiteTime - 1 };
        }
      });
    }, 1000);
    return interval; // Return interval ID for cleanup
  };


  const onSquareClick = (square:Square) => {
    const moves = game.moves({ square, verbose: true });

    if (moves.length === 0) return;

    // Highlight valid move squares
    const newHighlightedSquares = {};
    moves.forEach((move) => {
      newHighlightedSquares[move.to] = { background: 'rgba(255, 255, 0, 0.2)' };
    });

    setHighlightedSquares(newHighlightedSquares);
  };

  const annotateKingUnderCheck = ()=>{
    try 
    {
      if (!game.inCheck()) return;

      const kingUnderCheck = game.board().flat().find((piece)=>
        piece?.type == "k" && piece?.color==game.turn()
      )

      const hs = {};
      hs[kingUnderCheck?.square] = {background:'rgba(255, 0, 0, 0.5)'}
      setHighlightedSquares(hs)
      
    }
    catch(err)
    {
      console.error(err)
    }
  }

  // Format the time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const leftSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${leftSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  //start the game
  const handleGameStart = () => {
    if (playerColor != game.turn()) {
      toast({
        title: `You cannot start the Game.`,
      });
      return;
    }
    setGameState((prev) => {
      return { ...prev, state: GAME_STATE.INPROGRESS };
    });
    socket?.emit("start-game", { gameId: id });
  };

  const handleResign = () => {
    //push to the home page
    socket?.emit("resign", { gameId: id, playerColor });
    router.push("/");
  };

  const handleDraw = () => {
    setGameState((prev) => {
      return { ...prev, state: GAME_STATE.HALTED };
    });
    socket?.emit("draw", { gameId: id, playerColor, socketId: socket.id });
  };

  //main ws handler
  useEffect(() => {
    if (!socket) {
      return; // Return early if socket is not ready
    }
    console.log("Game starting with ID:", id);

    //make the user join the room
    socket?.emit("join-room", { gameID: id });

    //listen to the handshake event
    socket.on(
      "handshake-done",
      (data: { color: string; position: string; players: Player[] }) => {
        setPlayerColor(data.color);

        setGameState((prev: GameState) => {
          return {
            ...prev,
            blackPlayer: data.players.find(
              (player: Player) => player.color == "b"
            ),
            whitePlayer: data.players.find(
              (player: Player) => player.color == "w"
            ),
          };
        });
        // console.log(data);
        console.log(gameState);
        game.load(data.position);
      }
    );

    //listen for position change
    socket.on(
      "position-change",
      (data: {
        newFEN: string;
        time: { blackTime: number; whiteTime: number };
      }) => {
        console.log(data);
        setPosition(data.newFEN);
        game.load(data.newFEN);
        setHighlightedSquares({})
        if (game.inCheck())
        {
          annotateKingUnderCheck();
        }
        setGameState((prev) => {
          return {
            ...prev,
            blackTime: data.time.blackTime,
            whiteTime: data.time.whiteTime,
          };
        });
      }
    );

    //look for any alerts
    socket.on("alert", (data: { type: GAME_END_TYPE; message?: string }) => {
      setGameState((prev) => {
        return { ...prev, state: GAME_STATE.HALTED };
      });
      setAlert({ open: true, type: data.type });
    });

    //listen for game start
    socket.on("game-started", () => {
      setGameState((prev) => {
        return { ...prev, state: GAME_STATE.INPROGRESS };
      });
    });

    socket.on(
      "game-over",
      (data: { result: GAME_END_TYPE; winner?: string }) => {
        setAlert({ open: true, type: data.result });
      }
    );
    socket.on("draw-response", (data: { answer: boolean }) => {
      if (data.answer) {
        toast({
          title: "Opponent Accepted Draw!",
        });
        router.push("/");
      } else {
        toast({
          title: "Opponent Rejected The Draw Appeal!",
        });
        setGameState((prev) => {
          return { ...prev, state: GAME_STATE.INPROGRESS };
        });
      }
    });

    return () => {
      socket.off("game-started");
      socket.off("game-over");
    };
  }, [id, router]);

  // Timer effect: starts the timer once the component is mounted
  useEffect(() => {
    if (gameState.state == GAME_STATE.INPROGRESS) {
      const timerId = startTimer();
      // Clean up timer on unmount
      return () => {
        clearInterval(timerId);
      };
    }
  }, [game.turn(), gameState.state]);

  // Handle piece drops
  const onPieceDrop = (sourceSquare: Square, targetSquare: Square) => {
    try {
 
      if (gameState.state != GAME_STATE.INPROGRESS) {
        return false;
      }

   

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Always promote to queen
      });

      // If the move is invalid, display a toast notification
      if (move == null) {
        toast({
          title: "Invalid Move!",
        });
        return false;
      } else {
        const newPosition = game.fen(); // Get the new board position
        setPosition(newPosition); // Update position locally

        // Emit the move to the server
        socket?.emit("make-move", {
          roomId: id,
          from: sourceSquare,
          to: targetSquare,
          color: playerColor,
          time: playerColor == "w" ? gameState.whiteTime : gameState.blackTime,
        });

        return true;
      }
    } catch (err: any) {
      // Handle error and show a toast
      toast({
        title: "An error occurred",
        description: err.message || err,
      });
    }
  };

    return (
      <div className="flex flex-col h-screen">
        <GameAlert
          type={alert.type}
          open={alert.open}
          alert={setAlert}
          gameId={id}
          socket={socket}
        />
  
        {/* Header */}
        <header className="bg-background text-foreground flex justify-between items-center p-4">
          <Button
            variant="ghost"
            onClick={() => {
              router.push("/");
            }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back To Home
          </Button>
          <div>Turn: {game.turn() == "w" ? "White" : "Black"}</div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle chat</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <ChessGameChat
                socket={socket}
                gameId={id}
                playerName={playerColor === 'w' ? gameState.whitePlayer?.playerId : gameState.blackPlayer?.playerId}
              />
            </SheetContent>
          </Sheet>
        </header>
  
        {/* Game area */}
        <div className="flex-1 p-4 flex flex-col md:flex-row items-center justify-center">
          <div className="w-full max-w-2xl">
            <div className="w-full max-w-md mb-4 mx-auto">
              <div className="text-2xl font-bold dark:text-white text-right flex justify-between items-center">
                <span className="flex gap-2 items-center">
                  <Avatar>
                    <AvatarFallback>
                      {playerColor != "w"
                        ? gameState.whitePlayer?.playerId?.charAt(0).toUpperCase()
                        : gameState.blackPlayer?.playerId?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {playerColor != "w"
                    ? gameState.whitePlayer?.playerId
                    : gameState.blackPlayer?.playerId}
                </span>
                <span
                  style={{ color: game.turn() == playerColor ? "grey" : "black" }}
                  className="bg-gray-100 w-fit p-2 rounded"
                >
                  {playerColor == "b"
                    ? `${formatTime(gameState.whiteTime)}`
                    : `${formatTime(gameState.blackTime)}`}
                </span>
              </div>
            </div>
  
            {/* Chess board */}
            <div className="w-full max-w-md aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg mx-auto">
              <Chessboard
                areArrowsAllowed={true}
                arePiecesDraggable={true}
                id="ChessGameWithTimers"
                onSquareClick={onSquareClick}
                customSquareStyles={highlightedSquares}
                position={position}
                arePremovesAllowed={true}
                onPieceDrop={onPieceDrop}
                boardOrientation={playerColor === "w" ? "white" : "black"}
              />
            </div>
  
            <div className="w-full max-w-md mt-4 mx-auto">
              <div className="text-2xl font-bold dark:text-white flex justify-between items-center">
                <span className="flex gap-2 items-center ">
                  <Avatar>
                    <AvatarFallback>
                      {playerColor == "w"
                        ? gameState.whitePlayer?.playerId?.charAt(0).toUpperCase()
                        : gameState.blackPlayer?.playerId?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {playerColor == "w"
                    ? gameState.whitePlayer?.playerId
                    : gameState.blackPlayer?.playerId}
                </span>
                <span
                  className="bg-gray-100 w-fit p-2 rounded"
                  style={{ color: game.turn() == playerColor ? "black" : "gray" }}
                >
                  {playerColor == "b"
                    ? `${formatTime(gameState.blackTime)}`
                    : `${formatTime(gameState.whiteTime)}`}
                </span>
              </div>
            </div>
  
            {/* Game controls */}
            {gameState.state == GAME_STATE.INPROGRESS && (
              <div className="mt-4 flex space-x-2 justify-center">
                <Button variant="destructive" onClick={handleResign}>
                  Resign
                </Button>
                <Button variant="secondary" onClick={handleDraw}>
                  Offer Draw
                </Button>
              </div>
            )}
  
            {gameState.state == GAME_STATE.NOTSTARTED && (
              <div className="mt-4 flex space-x-2 justify-center">
                <Button variant="outline" onClick={handleGameStart}>
                  Start Game
                </Button>
              </div>
            )}
  
            {gameState.state == GAME_STATE.HALTED && (
              <div className="mt-4 flex space-x-2 justify-center">
                <Button variant="outline" onClick={handleGameStart}>
                  Continue
                </Button>
              </div>
            )}
          </div>
  
          {/* Chat component (visible on larger screens) */}
          <div className="hidden md:block w-full max-w-md mt-4 md:mt-0 md:ml-4">
            <ChessGameChat
              socket={socket}
              gameId={id}
              playerName={playerColor === 'w' ? gameState.whitePlayer?.playerId : gameState.blackPlayer?.playerId}
            />
          </div>
        </div>
      </div>
  );
}
