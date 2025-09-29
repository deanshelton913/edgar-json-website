import { NextResponse } from "next/server";
import { db } from "../../../db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Test database connection
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        currentTime: result[0].current_time,
        environment: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_DATABASE_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Database connection failed",
      message: error instanceof Error ? error.message : "Unknown error",
      environment: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_DATABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    }, { status: 500 });
  }
}

