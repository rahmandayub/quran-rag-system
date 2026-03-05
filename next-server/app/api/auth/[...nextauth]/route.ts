// NextAuth.js API route handler
// This handles all authentication-related requests

import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

const { handlers } = NextAuth(authConfig);

export const { GET, POST } = handlers;
