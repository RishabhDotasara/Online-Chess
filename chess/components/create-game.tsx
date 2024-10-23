"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Socket } from "socket.io-client";

type User = {
  id: string;
  name: string;
};

type CreateGameDialogProps = {
  isOpen: boolean;
  socket: Socket;
};

export function CreateGameDialog({ isOpen, socket }: CreateGameDialogProps) {
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);

  const [open, setOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const handleCreateGame = () => {
    try 
    {

    }
    catch(err)
    {
        console.log(err)
    }
  };

  useEffect(()=>{
    socket.emit("get-online-users")
    socket.on("online-users", (data: any) => {
      console.log(data)
      setOnlineUsers(data);
    });
  },[])
  

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Game</DialogTitle>
          <DialogDescription>
            Set up a new chess game by selecting an opponent and game type.
          </DialogDescription>
        </DialogHeader>
       
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="opponent" className="text-right">
              Opponent
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="col-span-3 justify-between"
                >
                  {selectedOpponent
                    ? selectedOpponent.name
                    : "Select opponent..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search opponent..." />
                  <CommandEmpty>No opponent found.</CommandEmpty>
                  <CommandGroup>
                    {onlineUsers && onlineUsers.map((user:any) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => {
                          setSelectedOpponent(user);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedOpponent?.id === user.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {user.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        <DialogFooter>
          <Button type="submit" onClick={handleCreateGame}>
            Create Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
