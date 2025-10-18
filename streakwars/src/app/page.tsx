"use client";

import { useUser } from "@clerk/nextjs";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LandingPage from "../components/LandingPage";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/20">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-indigo-200 border-t-indigo-600"></div>
        </div>
      </SignedIn>
    </div>
  );
}
