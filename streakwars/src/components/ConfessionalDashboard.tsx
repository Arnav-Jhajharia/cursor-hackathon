"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ConfessionalDashboardProps {
  userId: Id<"users">;
}

export default function ConfessionalDashboard({ userId }: ConfessionalDashboardProps) {
  const confessionals = useQuery(api.confessional.getUserConfessionals, { userId });

  if (!confessionals) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Confessionals</h2>
        <div className="text-center text-gray-500 py-8">
          Loading confessionals...
        </div>
      </div>
    );
  }

  if (confessionals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Confessionals</h2>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">🎬</div>
          <p>No confessionals yet!</p>
          <p className="text-sm mt-2">Break a streak or achieve a milestone to create your first confessional.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "processing":
        return "⏳";
      case "failed":
        return "❌";
      default:
        return "⏸️";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">My Confessionals</h2>
      
      <div className="space-y-4">
        {confessionals.map((confessional) => (
          <div
            key={confessional._id}
            className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {confessional.isAntiConfessional ? "🎉" : "😔"}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {confessional.habitName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {confessional.isAntiConfessional ? "Victory" : "Confession"} • {confessional.streakLength} days
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Scenario: {confessional.scenarioId}</span>
                  <span>•</span>
                  <span>{new Date(confessional.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(confessional.status)}`}>
                  {getStatusIcon(confessional.status)} {confessional.status}
                </span>
                
                {confessional.processedVideoUrl && (
                  <a
                    href={confessional.processedVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    🎬 Watch
                  </a>
                )}
              </div>
            </div>
            
            {confessional.errorMessage && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {confessional.errorMessage}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
