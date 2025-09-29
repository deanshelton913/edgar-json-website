import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { ParseRouteService } from '@/services/routes/ParseRouteService';

export async function GET(request: NextRequest) {
  try {
    const parseRouteService = container.resolve(ParseRouteService);
    return await parseRouteService.getInvokeV1(request);
  } catch (error) {
    console.error('Error in parse GET route:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          apiVersion: 'v1'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const parseRouteService = container.resolve(ParseRouteService);
    return await parseRouteService.postInvokeV1(request);
  } catch (error) {
    console.error('Error in parse POST route:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          apiVersion: 'v1'
        }
      },
      { status: 500 }
    );
  }
}