import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { TosDataAccess } from '@/data-access';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version') || '1.0.0';
    
    const tosDataAccess = container.resolve(TosDataAccess);
    const content = tosDataAccess.getTosContent(version);
    const currentVersion = tosDataAccess.getCurrentTosVersion();
    
    return NextResponse.json({
      success: true,
      data: {
        content,
        version,
        currentVersion,
        isCurrentVersion: version === currentVersion,
      }
    });

  } catch (error) {
    console.error('[TOS_CONTENT] Error getting TOS content:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
