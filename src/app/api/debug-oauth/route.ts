import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const port = searchParams.get('port') || '3000';
  
  const isDevelopment = request.url.includes('localhost');
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  
  let redirectUri;
  if (isDevelopment) {
    redirectUri = `http://localhost:${port}/api/auth/callback`;
  } else if (vercelUrl) {
    redirectUri = `${vercelUrl}/api/auth/callback`;
  } else {
    redirectUri = `${request.nextUrl.origin}/api/auth/callback`;
  }

  return NextResponse.json({
    environment: {
      isDevelopment,
      vercelUrl,
      origin: request.nextUrl.origin,
      port,
    },
    redirectUri,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'configured' : 'missing',
    instructions: {
      step1: 'Go to Google Cloud Console',
      step2: 'Navigate to APIs & Services → Credentials',
      step3: 'Edit your OAuth 2.0 Client ID',
      step4: `Add this exact URI to "Authorized redirect URIs": ${redirectUri}`,
    }
  });
}
