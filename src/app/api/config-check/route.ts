import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    // Test environment variables
    const config = {
      hasAwsRegion: !!process.env.AWS_REGION,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasCognitoDomain: !!process.env.COGNITO_DOMAIN,
      hasCognitoClientId: !!process.env.COGNITO_CLIENT_ID,
      hasPublicCognitoDomain: !!process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
      hasPublicCognitoClientId: !!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      hasDatabaseUrl: !!(process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL),
      hasVercelUrl: !!process.env.NEXT_PUBLIC_VERCEL_URL,
      nodeEnv: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1',
      currentUrl: request.url,
    };

    return NextResponse.json({
      success: true,
      message: "Configuration check successful",
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(error, 'CONFIG_CHECK_ROUTE');
  }
}
