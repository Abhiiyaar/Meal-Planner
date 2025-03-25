// app/profile/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { availablePlans, Plan } from "@/lib/plans"; // Adjust the path based on your project structure
import Image from "next/image";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast"; // Import toast
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch Subscription Details
  const {
    data: subscription,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/profile/subscription-status");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch subscription.");
      }
      return res.json();
    },
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Adjusted Matching Logic Using subscription tier
  const currentPlan = availablePlans.find(
    (plan) => plan.interval === subscription?.subscription?.subscriptionTier
  );

  // Mutation: Unsubscribe
  const unsubscribeMutation = useMutation<
    any, // Replace with actual response type if available
    Error,
    void
  >({
    mutationFn: async () => {
      const res = await fetch("/api/profile/unsubscribe", {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to unsubscribe.");
      }
      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      router.push("/subscribe");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handle Unsubscribe Button Click
  const handleUnsubscribe = () => {
    if (
      confirm(
        "Are you sure you want to unsubscribe? You will lose access to premium features."
      )
    ) {
      unsubscribeMutation.mutate();
    }
  };

  // Loading or Not Signed In States
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-emerald-100">
        <Spinner />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-emerald-100">
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  // Main Profile Page UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-100 p-4">
      <Toaster position="top-center" />{" "}
      {/* Optional: For toast notifications */}
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left Panel: Profile Information */}
          <div className="w-full md:w-1/3 p-6 bg-emerald-500 text-white flex flex-col items-center">
            <Image
              src={user.imageUrl || "/default-avatar.png"} // Provide a default avatar if none
              alt="User Avatar"
              width={100}
              height={100}
              className="rounded-full mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mb-4">{user.primaryEmailAddress?.emailAddress}</p>
            {/* Add more profile details or edit options as needed */}
          </div>

          {/* Right Panel: Subscription Details */}
          <div className="w-full md:w-2/3 p-6 bg-gray-50">
            <h2 className="text-2xl font-bold mb-6 text-emerald-700">
              Subscription Details
            </h2>

            {isLoading ? (
              <div className="flex items-center">
                <Spinner />
                <span className="ml-2">Loading subscription details...</span>
              </div>
            ) : isError ? (
              <p className="text-red-500">{error?.message}</p>
            ) : subscription ? (
              <div className="space-y-6">
                {/* Current Subscription Info */}
                <div className="bg-white shadow-md rounded-lg p-4 border border-emerald-200">
                  <h3 className="text-xl font-semibold mb-2 text-emerald-600">
                    Current Plan
                  </h3>
                  {currentPlan ? (
                    <>
                      <p>
                        <strong>Plan:</strong> {currentPlan.name}
                      </p>
                      <p>
                        <strong>Amount:</strong> ${currentPlan.amount}{" "}
                        {currentPlan.currency}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {subscription.subscription.subscriptionActive
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </p>
                    </>
                  ) : (
                    <p className="text-yellow-500">
                      {subscription?.subscription?.subscriptionTier 
                        ? `Plan type "${subscription.subscription.subscriptionTier}" not found in available plans.`
                        : "No active subscription found."}
                    </p>
                  )}
                </div>

                {/* Unsubscribe */}
                <div className="bg-white shadow-md rounded-lg p-4 border border-emerald-200">
                  <h3 className="text-xl font-semibold mb-2 text-emerald-600">
                    Unsubscribe
                  </h3>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={unsubscribeMutation.isPending}
                    className={`w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors ${
                      unsubscribeMutation.isPending
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {unsubscribeMutation.isPending
                      ? "Unsubscribing..."
                      : "Unsubscribe"}
                  </button>
                </div>
              </div>
            ) : (
              <p>You are not subscribed to any plan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




