import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile via Prisma
    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    console.log("Profile data for subscription status:", profile);

    // If no profile found, return null
    if (!profile) {
      return NextResponse.json({ subscription: null });
    }

    // If there's a Stripe subscription ID but status is inactive, verify with Stripe
    if (profile.stripeSubscriptionId && !profile.subscriptionActive) {
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
        
        // If subscription is active in Stripe but not in our DB, update our DB
        if (subscription.status === 'active') {
          await prisma.profile.update({
            where: { userId: clerkUser.id },
            data: { subscriptionActive: true }
          });
          
          // Update the profile object to reflect the change
          profile.subscriptionActive = true;
          console.log("Updated subscription status to active");
        }
      } catch (stripeError) {
        console.error("Error verifying subscription with Stripe:", stripeError);
      }
    }

    return NextResponse.json({ subscription: profile });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details." },
      { status: 500 }
    );
  }
}

