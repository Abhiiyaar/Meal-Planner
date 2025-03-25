import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getPriceIdFromType } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const { planType, userId, email } = await request.json();

    console.log("Checkout request received:", { planType, userId, emailProvided: !!email });

    if (!planType || !userId || !email) {
      return NextResponse.json(
        { error: "Plan type, User ID, and Email are required." },
        { status: 400 }
      );
    }

    const allowedPlanTypes = ["week", "month", "year"];
    if (!allowedPlanTypes.includes(planType)) {
      return NextResponse.json(
        { error: "Invalid plan type." },
        { status: 400 }
      );
    }

    const priceId = getPriceIdFromType(planType);
    if (!priceId) {
      console.error(`Price ID not found for plan type: ${planType}`);
      return NextResponse.json(
        { error: "Price ID for the selected plan not found." },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session with better error handling
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscribe?canceled=true`,
        metadata: {
          clerkUserId: userId,
          planType: planType,
        },
      });

      console.log("Checkout session created:", { sessionId: session.id });
      return NextResponse.json({ url: session.url });
    } catch (stripeError: any) {
      console.error("Stripe session creation error:", stripeError);
      return NextResponse.json(
        { error: stripeError.message || "Failed to create checkout session" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Checkout API Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}



