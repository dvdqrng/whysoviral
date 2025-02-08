import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { sql } from "@vercel/postgres"
import { compare } from "bcrypt"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await sql`
          SELECT * FROM users WHERE email = ${credentials.email}
        `.then((res) => res.rows[0])

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password_hash)

        if (!isPasswordValid) {
          return null
        }

        return { id: user.id, email: user.email }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
})

export { handler as GET, handler as POST }

