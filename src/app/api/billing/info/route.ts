import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { BillingInfoRouteService } from "@/services/routes/BillingInfoRouteService";
import { handleRouteError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const billingInfoRouteService = container.resolve(BillingInfoRouteService);
    const result = await billingInfoRouteService.getInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      email: result.email,
      name: result.name,
      address: result.address,
      isTestCustomer: result.isTestCustomer,
    });
  } catch (error) {
    return handleRouteError(error, 'BILLING_INFO_ROUTE');
  }
}