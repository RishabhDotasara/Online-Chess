'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Gamepad } from 'lucide-react'
import { useRecoilState, useRecoilValue } from 'recoil'

import { io, Socket } from 'socket.io-client'
import { useRouter } from 'next/navigation'


export default function GameCreation() {
  const [gameId, setGameId] = useState('')
  const router = useRouter();
  

  const handleStartGame = async () => {
    try 
    {
      const response = await fetch(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL+"/startGame")
      const data = await response.json()
      console.log(data);
      router.push(`/room/${data.id}`);
    }
    catch(err)
    {
      console.log(err);
    }
  }

  const handleJoinGame = () => {
    if (gameId.trim() === '') {
      alert('Please enter a valid Game ID')
      return
    }
    router.push(`/room/${gameId}`)
    console.log(`Joining game with ID: ${gameId}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <Card className="w-[350px]">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Gamepad className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Chess Game</CardTitle>
          <CardDescription className="text-center">Start a new game or join an existing one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full text-lg py-6" 
            onClick={handleStartGame}
          >
            Start New Game
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter Game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            <Button 
              className="w-full" 
              variant="outline"
              onClick={handleJoinGame}
            >
              Join Game
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-center text-gray-500">
          Challenge your friends to a game of chess!
        </CardFooter>
      </Card>
    </div>
  )
}
