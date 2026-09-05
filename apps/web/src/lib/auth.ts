import type { NextAuthOptions, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";

const prefix = process.env.AUTH_COOKIE_PREFIX ?? "mamuy-qr";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: `${prefix}.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        accessToken: { label: "token", type: "text" },
      },
      async authorize(credentials) {
        const accessToken = credentials?.accessToken;
        const secret = process.env.NEXTAUTH_SECRET;
        if (!accessToken || !secret) return null;
        try {
          const payload = jwt.verify(accessToken, secret) as { sub: string; email?: string };
          const user: User & { accessToken: string } = {
            id: String(payload.sub),
            email: String(payload.email ?? ""),
            accessToken,
          };
          return user;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.accessToken = (user as User & { accessToken: string }).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email as string;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
};
