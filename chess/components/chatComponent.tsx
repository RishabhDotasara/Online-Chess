import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Send } from 'lucide-react'

interface Message {
  sender: string
  content: string
  timestamp: number
}

interface ChatProps {
  socket: any
  gameId: string
  playerName: string
}

export default function ChessGameChat({ socket, gameId, playerName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (socket) {
      socket.on('chat-message', (message: Message) => {
        setMessages(prevMessages => [...prevMessages, message])
      })
    }

    return () => {
      if (socket) {
        socket.off('chat-message')
      }
    }
  }, [socket])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = () => {
    if (inputMessage.trim() !== '') {
      const newMessage: Message = {
        sender: playerName,
        content: inputMessage,
        timestamp: Date.now()
      }
      socket.emit('send-chat-message', { gameId, message: newMessage })
      setInputMessage('')
    }
  }

  return (
    <Card className="w-full max-w-md h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start mb-4 ${msg.sender === playerName ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex ${msg.sender === playerName ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%]`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{msg.sender[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={`mx-2 p-2 rounded-lg ${msg.sender === playerName ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <p className="text-sm font-medium">{msg.content}</p>
                  <p className="text-xs opacity-50">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}