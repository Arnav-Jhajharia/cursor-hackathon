"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface SplitwiseConnectProps {
  userId: Id<"users">;
  onConnected?: () => void;
}

export default function SplitwiseConnect({ userId, onConnected }: SplitwiseConnectProps) {
  const [splitwiseUserId, setSplitwiseUserId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const connectSplitwise = useMutation(api.splitwise.connectSplitwiseAccount);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitwiseUserId.trim()) return;

    setIsConnecting(true);
    try {
      await connectSplitwise({
        userId,
        splitwiseUserId: splitwiseUserId.trim(),
      });
      setIsConnected(true);
      onConnected?.();
    } catch (error) {
      console.error("Error connecting Splitwise:", error);
      alert("Failed to connect Splitwise account. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-800 font-medium">Splitwise Connected</span>
        </div>
        <p className="text-green-700 text-sm mt-1">
          You can now participate in money challenges!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="text-2xl">💰</div>
        <div>
          <h3 className="font-semibold text-blue-900">Connect Splitwise</h3>
          <p className="text-blue-700 text-sm">
            Connect your Splitwise account to participate in money challenges
          </p>
        </div>
      </div>

      <form onSubmit={handleConnect} className="space-y-3">
        <div>
          <label htmlFor="splitwiseUserId" className="block text-sm font-medium text-blue-900 mb-1">
            Splitwise User ID
          </label>
          <input
            type="text"
            id="splitwiseUserId"
            value={splitwiseUserId}
            onChange={(e) => setSplitwiseUserId(e.target.value)}
            placeholder="Enter your Splitwise user ID"
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-blue-600 text-xs mt-1">
            You can find your Splitwise user ID in your account settings
          </p>
        </div>

        <button
          type="submit"
          disabled={isConnecting || !splitwiseUserId.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isConnecting ? "Connecting..." : "Connect Splitwise"}
        </button>
      </form>

      <div className="mt-3 p-3 bg-blue-100 rounded-lg">
        <h4 className="font-medium text-blue-900 text-sm mb-2">How to find your Splitwise User ID:</h4>
        <ol className="text-blue-700 text-xs space-y-1">
          <li>1. Go to splitwise.com and log in</li>
          <li>2. Click on your profile picture</li>
          <li>3. Go to "Account Settings"</li>
          <li>4. Your user ID is in the URL or profile section</li>
        </ol>
      </div>
    </div>
  );
}
