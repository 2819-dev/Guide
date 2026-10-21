import { auth } from "@/lib/auth/server";

export const runtime = 'edge';

export const { GET, POST } = auth.handler();
