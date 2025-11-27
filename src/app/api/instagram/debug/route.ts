// Temporary debug endpoint to check environment variables
import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        hasUserId: !!process.env.IG_USER_ID,
        hasToken: !!process.env.IG_ACCESS_TOKEN,
        userIdLength: process.env.IG_USER_ID?.length || 0,
        tokenLength: process.env.IG_ACCESS_TOKEN?.length || 0,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('IG')),
    });
}
