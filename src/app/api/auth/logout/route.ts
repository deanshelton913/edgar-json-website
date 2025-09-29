import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';

export async function POST(request: NextRequest) {
  console.log('Logout request received');
  
  try {
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    await cookieAuthorizer.clearSession();
    
    console.log('Session cleared successfully');
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}