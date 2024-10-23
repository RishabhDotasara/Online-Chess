'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { User, Zap, Bot, UserPlus, Trophy, LucideLoaderCircle, Loader, WifiHighIcon, WifiHigh } from "lucide-react"
import { useRecoilState } from "recoil"
import { nameAtom } from "@/states/nameAtom"
import { useSocket } from "@/providers/socketProvider"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Header from "./header"
import { Skeleton } from "./ui/skeleton"


export default function Component() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const socket: Socket = useSocket();
  const [username, setUsername] = useRecoilState(nameAtom)
  const [stats, setStats] = useState({
    online_players:0,
    matchmaking:0,
    games_in_progress:0
  });
  const [gameFound, setGameFound] = useState(false);
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      console.log(session);
    }
    try {
      // if (!socket) return;
      socket.emit("map-data", {
        playerId: username,
        user: {username:username},
      });
      socket.on("update-stats", (data) => {
        setStats(data);
        console.log(data);
      });
      socket.on(
        "game-created",
        (data: { roomId: string; opponent: string }) => {
          setGameFound(true);
          console.log(data);
          router.push("/room/" + data.roomId);
        }
      );
    } catch (err) {
      console.error("Error COnnecting To The Server, Please Refresh the page.");
    }
  }, [status, router]);
  const handleQuickPlay = async () => {
    try {
      setIsMatchmaking(true);
      fetch(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL + "/find-match", {
        method: "POST",
        body: JSON.stringify({
          playerId: username,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        const json = await res.json();
        console.log(json);
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handlePlayAI = ()=>{}

  if (status === "loading") {
    return <SkeletonLoader />;
  }
  if (!session) {
    return null;
  }


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Header/>
      <Card className="w-full max-w-md bg-background shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-between">
            <span>Chess Profile</span>
            <Badge variant="secondary" className="bg-green-200 dark:bg-green-500 flex items-center justify-center scale-105">
              <WifiHigh className="h-4 w-4 mr-1" />
              Online: {stats.online_players}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src="/placeholder.svg" alt="Alice Chess" />
              <AvatarFallback>
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold text-primary">{username}</h2>
              <p className="text-muted-foreground">Chess Enthusiast</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Button onClick={handleQuickPlay} className="w-full" size="lg">
              <Zap className="mr-2 h-4 w-4" /> Quick Play
            </Button>
          </div>
        </CardContent>
      </Card>


      <Dialog open={isMatchmaking} onOpenChange={setIsMatchmaking}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finding a Match</DialogTitle>
            <DialogDescription>
              {!gameFound && <h1>Please wait while we find an opponent for you...</h1>}
              {gameFound && <h2>Game Found!</h2>}
            </DialogDescription>
          </DialogHeader>
          {!gameFound && <LucideLoaderCircle className="animate-spin mx-auto h-12 w-12" />}
          {gameFound && <Trophy className="mx-auto h-12 w-12" />}
          {!gameFound && (
            <div className="text-center text-sm text-muted-foreground">This may take a few moments</div>
          )}
          {gameFound && <div className="text-center text-sm text-muted-foreground">Starting The Game!</div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}