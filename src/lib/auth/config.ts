import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users, organizations, boards, columns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // First login — find or create user in our DB
        const email = profile.email!;
        const name = profile.name || email.split("@")[0];
        const googleId = profile.sub;
        const image = (profile as any).picture;

        // Check if user exists
        let [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!existingUser) {
          // Create organization for new user
          const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");

          const [org] = await db
            .insert(organizations)
            .values({
              name: `${name}'s Workspace`,
              slug: `${slug}-${Date.now()}`,
            })
            .returning();

          // Create user
          [existingUser] = await db
            .insert(users)
            .values({
              email,
              name,
              avatarUrl: image,
              googleId,
              orgId: org.id,
              role: "owner",
            })
            .returning();

          // Create default board with columns
          const [board] = await db
            .insert(boards)
            .values({
              orgId: org.id,
              name: "Main Board",
              description: "Your primary project board",
              isDefault: true,
            })
            .returning();

          await db.insert(columns).values([
            { boardId: board.id, name: "Backlog", position: 0, color: "#6b7280" },
            { boardId: board.id, name: "Todo", position: 1, color: "#3b82f6" },
            { boardId: board.id, name: "In Progress", position: 2, color: "#f59e0b" },
            { boardId: board.id, name: "Review", position: 3, color: "#8b5cf6" },
            { boardId: board.id, name: "Done", position: 4, color: "#10b981" },
          ]);
        }

        token.id = existingUser.id;
        token.orgId = existingUser.orgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
        (session.user as any).orgId = token.orgId as string;
      }
      return session;
    },
  },
});
