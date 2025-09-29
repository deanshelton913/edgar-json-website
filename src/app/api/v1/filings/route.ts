import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { FilingsRouteService } from "@/services/routes/FilingsRouteService";

export async function GET(request: NextRequest) {
  try {
    const filingsRouteService = container.resolve(FilingsRouteService);
    return await filingsRouteService.getInvokeV1(request);
  } catch (error) {
    console.error('Error in filings route:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          processedAt: new Date().toISOString(),
          apiVersion: 'v1',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const filingsRouteService = container.resolve(FilingsRouteService);
    return await filingsRouteService.postInvokeV1(request);
  } catch (error) {
    console.error('Error in filings route:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          processedAt: new Date().toISOString(),
          apiVersion: 'v1',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}