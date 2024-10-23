'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSocket } from '@/providers/socketProvider'
import { signIn } from 'next-auth/react'
import { useSetRecoilState } from 'recoil'
import { nameAtom } from '@/states/nameAtom'
import { Loader, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Simulated function to check if a username is taken
const isUsernameTaken = (username: string) => {
  // This is a placeholder. In a real app, you'd check against your database.
  const takenUsernames = ['chess123', 'grandmaster', 'queenE4'];
  return takenUsernames.includes(username.toLowerCase());
}

// Function to generate username suggestions
const generateSuggestions = (username: string) => {
  const suffixes = ['Player', 'Master', 'Knight', 'Bishop', 'Rook'];
  return suffixes.map(suffix => `${username}${suffix}`);
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const router = useRouter()
  const socket = useSocket();
  const setGlobalUsername = useSetRecoilState(nameAtom)
  const [isLoading,setIsLoading] = useState(false)
  const {toast} = useToast();
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    if (isUsernameTaken(newUsername)) {
      setSuggestions(generateSuggestions(newUsername));
    } else {
      setSuggestions([]);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try 
    {
      if (username == "")
      {
        toast({
          title:"Invalid Username!"
        })
        return;
      }
      setIsLoading(true);
        signIn('credentials', { redirect: false, username }).then((res:any)=>{
          try 
          {
            if (res.ok)
            {
              // console.log(res)
              setGlobalUsername(username)
              setIsLoading(false)
              toast({
                title:"Login Successful."
              })
              router.push("/")
            }
            
          }
          catch(err)
          {
            toast({
              title:"Username Already Taken!"
            })
            setIsLoading(false)
            console.log(err);
          }
        })
    }
    catch(err)
    {
      console.log(err)
      alert("Error, reload the page.!")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">Chess Game</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Choose your username</Label>
              <Input
                id="username"
                placeholder="Enter a unique username"
                value={username}
                onChange={handleUsernameChange}
                className="w-full"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">This username is taken. Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setUsername(suggestion)}
                      className="text-sm"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              Start Playing
              {isLoading && <Loader2 className='animate-spin h-4 w-4 ml-2'/>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}