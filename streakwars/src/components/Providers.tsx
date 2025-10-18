"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import WarNotificationBanner from "./WarNotificationBanner";
import WarPressureSystem from "./WarPressureSystem";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <WarNotificationBanner />
      <WarPressureSystem>
        {children}
      </WarPressureSystem>
    </ConvexProvider>
  );
}

