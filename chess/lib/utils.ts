import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum GAME_END_TYPE {
  "RESIGN",
  "DRAW",
  "STALEMATE",
  "CHECKMATE",
  "AUTO_DRAW",
  "TIMEOUT"
}

export enum GAME_STATE {
  "INPROGRESS",
  "HALTED",
  "OVER",
  "NOTSTARTED",
  "OUT_OF_TIME"
}

export interface Player {
  socketId: string;
  playerId?: string;
  color: string;
  username?: string;
  image?: string;
}

export interface GameState {
  blackTime: number; // 10 minutes in seconds
  whiteTime: number;
  state: GAME_STATE;
  blackPlayer: Player | undefined; // Added player names
  whitePlayer: Player | undefined; // Added player names
}
