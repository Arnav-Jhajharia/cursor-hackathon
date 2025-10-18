"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import FriendsList from "../../components/FriendsList";

export default function FriendsPage() {
  const { user } = useUser();

  // Get or create user
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (user && !currentUser) {
      createOrUpdateUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "User",
        avatar: user.imageUrl,
      });
    }
  }, [user, currentUser, createOrUpdateUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends</h1>
          <p className="text-gray-600">Connect with friends and compete together</p>
        </div>

        {/* Friends Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <FriendsList userId={currentUser._id} />
        </div>
      </div>
    </div>
  );
}
