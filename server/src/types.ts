import { Chess } from "chess.js";
import { Socket } from "socket.io";

export interface Job<T extends Record<string, any> = {}> {
  jobId: number;
  job: T;
}

export interface CustomSocket extends Socket{
  username:string
}

export interface Player {
  socketId: string;
  playerId?: string;
  color: string;
  username?: string;
  image?: string;
}

export interface Game {
  gameId: string;
  game: Chess;
  players: Player[];
  moves: string[];
  turn: string;
  timestamps: {
    blackTime: number;
    whiteTime: number;
  };
}

export enum GAME_END_TYPE {
  "RESIGN",
  "DRAW",
  "STALEMATE",
  "CHECKMATE",
  "AUTO_DRAW",
}

export interface Stats {
  online_players: number;
  matchmaking: number;
  games_in_progress: number;
}
