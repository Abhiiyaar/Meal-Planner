import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  try {
    // Use the query param
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { subscriptionActive: true, stripeSubscriptionId: true },
    });

    // If no profile exists, return false but don't error
    if (!profile) {
      return NextResponse.json({ subscriptionActive: false });
    }

    // If there's a subscription ID but status is inactive, verify with Stripe
    if (profile.stripeSubscriptionId && !profile.subscriptionActive) {
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
        
        // If subscription is active in Stripe but not in our DB, update our DB
        if (subscription.status === 'active') {
          await prisma.profile.update({
            where: { userId },
            data: { subscriptionActive: true }
          });
          
          return NextResponse.json({ subscriptionActive: true });
        }
      } catch (stripeError) {
        console.error("Error verifying subscription with Stripe:", stripeError);
        // Continue with the database value if Stripe check fails
      }
    }

    return NextResponse.json({ subscriptionActive: !!profile.subscriptionActive });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("check-subscription error:", errorMessage);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


