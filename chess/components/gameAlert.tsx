import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { GAME_END_TYPE } from "@/lib/utils";
import { Socket } from "socket.io-client";
import { GiChessKing } from "react-icons/gi";

export default function GameAlert({
  type,
  open,
  alert,
  gameId,
  socket,
}: {
  type: GAME_END_TYPE;
  open: boolean | undefined;
  alert: () => void;
  gameId: string;
  socket: Socket;
}) {
  const router = useRouter();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-background text-foreground">
        <AlertDialogHeader>
          {type === GAME_END_TYPE.RESIGN && (
            <>
              <AlertDialogTitle>
                Your Opponent Resigned The Game.
              </AlertDialogTitle>
              <AlertDialogDescription>You Win!</AlertDialogDescription>
            </>
          )} 
           {type === GAME_END_TYPE.DRAW && (
            <>
              <AlertDialogTitle>Opponent Asks For A Draw</AlertDialogTitle>
              <AlertDialogDescription>
                Opponent asks to end the match at a draw.
              </AlertDialogDescription>
            </>
          )}
           {type === GAME_END_TYPE.AUTO_DRAW && (
            <>
              <AlertDialogTitle>Game Ends In a Draw.</AlertDialogTitle>
            </>
          )}
           {type === GAME_END_TYPE.STALEMATE && (
            <>
              <AlertDialogTitle>StaleMate</AlertDialogTitle>
            </>
          )}
           {type === GAME_END_TYPE.CHECKMATE && (
            <>
              <AlertDialogTitle className="flex gap-2 items-center"><GiChessKing className="mr-2 h-8 w-8"/>CheckMate</AlertDialogTitle>
            </>
          )}
         
        </AlertDialogHeader>
        <AlertDialogFooter>
          {type === GAME_END_TYPE.DRAW ?(
            <>
              <AlertDialogCancel
                onClick={() => {
                  alert({ open: false, type: GAME_END_TYPE.RESIGN });
                  socket.emit("draw-answer", { answer: false });
                }}
              >
                No
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  socket.emit("draw-answer", { answer: true }),
                    router.push("/");
                }}
              >
                Yes
              </AlertDialogAction>
            </>
          ):
           (
            <>
              <AlertDialogAction
                onClick={() => {
                  router.push("/replay/" + gameId);
                }}
                className="bg-background text-foreground"
              >
                Watch Replay
              </AlertDialogAction>
              <AlertDialogAction onClick={() => router.push("/")}>
                New Game
              </AlertDialogAction>
            </>
          )}
          
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
