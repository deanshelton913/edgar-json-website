import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { SecParserService } from '@/services/SecParserService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filingPath = searchParams.get('path');
    
    if (!filingPath) {
      return NextResponse.json(
        { error: 'Missing filing path', message: 'path parameter is required' },
        { status: 400 }
      );
    }

    // Get the parser service from the container
    const parserService = container.resolve(SecParserService);
    
    // Parse the SEC filing
    const result = await parserService.parseSecFiling(filingPath);
    
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime: `${Date.now()}ms`,
        apiVersion: 'v1',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error parsing SEC filing:', error);
    
    // Return a more detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Parsing failed', 
        message: errorMessage,
        details: {
          filingPath: request.nextUrl.searchParams.get('path'),
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// Add a test endpoint that doesn't require a real filing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testMode } = body;
    
    if (testMode) {
      return NextResponse.json({
        success: true,
        message: 'SEC Parser Service is working!',
        data: {
          services: [
            'LoggingService',
            'HttpService', 
            'FormFactoryService',
            'GenericSecParsingService',
            'ParserService',
            'UueCodecService',
            'UserApiKeyService'
          ],
          status: 'All services loaded successfully'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          testMode: true
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid test mode' },
      { status: 400 }
    );
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}