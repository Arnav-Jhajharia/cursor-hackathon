"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface SabotageHabitBlockerProps {
  userId: Id<"users">;
  challengeId: Id<"challenges">;
  children: React.ReactNode;
}

export default function SabotageHabitBlocker({ userId, challengeId, children }: SabotageHabitBlockerProps) {
  const sabotageEffects = useQuery(api.sabotageEffects.getSabotageEffects, { userId, challengeId });

  // If under sabotage with habit blocking, show blocked UI
  if (sabotageEffects?.isUnderSabotage && sabotageEffects.effects.includes("habit_blocking")) {
    return (
      <div className="relative">
        {/* Blurred/blocked content */}
        <div className="filter blur-sm pointer-events-none opacity-50">
          {children}
        </div>
        
        {/* Overlay with sabotage message */}
        <div className="absolute inset-0 bg-red-900 bg-opacity-80 flex items-center justify-center rounded-lg">
          <div className="text-center text-white p-6">
            <div className="text-4xl mb-4">🚫</div>
            <h3 className="text-xl font-bold mb-2">HABITS BLOCKED!</h3>
            <p className="text-sm mb-4">
              You cannot complete habits while under sabotage!
            </p>
            <p className="text-xs opacity-75">
              Complete escape tasks to regain control of your habits.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal content when not under sabotage
  return <>{children}</>;
}
