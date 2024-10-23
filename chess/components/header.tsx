"use client";
import React from "react";
import { GiChessBishop } from "react-icons/gi";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const DropDown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PlusCircledIcon className="w-6 h-6 cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit mr-24">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link href={"/game/create"}>Create Game</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>Create Tournament</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function Header() {
  const session = useSession();
  return (
    
      <header className=" fixed left-1/2 -translate-x-1/2 top-2 mx-auto shadow rounded-lg p-6 mb-6 flex justify-between items-center w-4/5 mt-4 z-10 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-primary flex gap-2">
          <GiChessBishop className="h-8 w-8" />
        </h1>
        <div className="flex items-center gap-4">
          
          <ModeToggle />
          {session.status == "authenticated" && (
            <Button
              onClick={() => signOut({ callbackUrl: "/login" })}
              variant="outline"
              className="text-primary"
            >
              Sign Out
            </Button>
          )}
        </div>
      </header>
   
  );
}
