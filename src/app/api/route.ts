import type { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2023-08-16",
});

export async function POST(req: NextRequest) {
	try {
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "usd",
						product_data: { name: "EDGAR API Key Subscription" },
						unit_amount: 100,
						recurring: { interval: "month" },
					},
					quantity: 1,
				},
			],
			mode: "subscription",
			success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
			cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		return NextResponse.json(
			{ error: "Error creating checkout session" },
			{ status: 500 },
		);
	}
}
