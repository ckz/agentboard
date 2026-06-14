import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "NOT SET",
    GOOGLE_CLIENT_ID_SET: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET_SET: !!process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
  });
}
