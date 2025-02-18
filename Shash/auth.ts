import NextAuth, {DefaultSession} from "next-auth";
import Google from "next-auth/providers/google";
import { setAuthToken, clearAuthToken } from "@/lib/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

declare module "next-auth" {
  interface Session extends DefaultSession {
    jwt?: string; // ✅ Add `jwt` to the Session type
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    jwt?: string; // ✅ Add `jwt` to JWT type
    id: string;
  }
}


export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) { 
      if (account && user) {
        try {
          const response = await fetch(
            `${API_URL}/api/auth/${account.provider}/callback?access_token=${account.access_token}`
          );
          const data = await response.json();
          
          if (data.jwt) {
            token.jwt = data.jwt;
            token.id = data.user.id;
            setAuthToken(data.jwt);

            await fetch(`${API_URL}/api/users`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${data.jwt}`,
              },
              body: JSON.stringify({
                id: user.id,  
                email: user.email,
                name: user.name,
                image: user.image,
                provider: account.provider,
                role: "user",
              }),
            });
          }
        } catch (error) {
          console.error("Error in jwt callback:", error);
        }
      }
      return token;
    },

    async session({ session, token }) { 
      if (token) {
        session.jwt = token.jwt as string;
        session.user = {
          ...session.user,
          id: token.id as string,
        };
      }
      return session;
    }
  },
  events: {
    async signOut() {
      // When a user signs out, clear the auth token cookie
      await clearAuthToken();
    },
  },
});