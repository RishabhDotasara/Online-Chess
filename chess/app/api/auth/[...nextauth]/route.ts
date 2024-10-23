
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"


const handler = NextAuth({
  providers: [
    // Add your providers here
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID || "",
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    Credentials({
      name: 'credentials',
      credentials: {
      username: { label: "Username", type: "text" }
      },
      async authorize(credentials) {
        try 
        {
            const response = await fetch(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL + "/get-username", {
              method:"POST",
              body:JSON.stringify({
                username:credentials?.username
              })
            })
            console.log(response.ok)
            if (response.ok)
            {
              console.log("Login Successful.")
              return {id:credentials?.username}
            }
            else 
            {
              console.log("Username Already Exists!")
              return null
            }
        }
        catch(err)
        {
          console.log("Error signing in!", err)

          return null
        }
    }})
  ],
  secret:"chess.project",
  session:{
    strategy:'jwt',
  }
  
})

export { handler as GET, handler as POST }