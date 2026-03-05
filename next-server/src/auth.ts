// Main NextAuth configuration file
// This is the entry point for Auth.js in Next.js App Router

import NextAuth from "next-auth";
import authConfig from "./lib/auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
