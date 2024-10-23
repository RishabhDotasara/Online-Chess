"use client"
import { atom } from "recoil";
import { io, Socket } from "socket.io-client";

const socketAtom = atom({
    key:"socketAtom",
    default:null
})

export default socketAtom;