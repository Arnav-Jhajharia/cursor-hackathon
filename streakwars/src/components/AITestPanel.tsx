"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function AITestPanel() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const generateHumiliation = useAction(api.aiHumiliation.generateHumiliationMessage);
  const generateTaunt = useAction(api.aiHumiliation.generateWarTaunt);

  const testAIHumiliation = async () => {
    setIsLoading(true);
    try {
      const result = await generateHumiliation({
        winnerName: "TestWinner",
        loserName: "TestLoser",
        warStakes: 50,
        winnerPoints: 100,
        loserPoints: 25,
        challengeName: "Test Challenge",
        warDuration: 3,
      });
      setTestResult({ type: "humiliation", data: result });
    } catch (error: any) {
      setTestResult({ type: "error", data: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testAITaunt = async () => {
    setIsLoading(true);
    try {
      const result = await generateTaunt({
        challengerName: "TestChallenger",
        defenderName: "TestDefender",
        challengerPoints: 75,
        defenderPoints: 30,
        challengeName: "Test Challenge",
        isChallenger: true,
      });
      setTestResult({ type: "taunt", data: result });
    } catch (error: any) {
      setTestResult({ type: "error", data: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 to-black border-4 border-purple-600 rounded-2xl p-8 mb-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🤖🧪</div>
        <h2 className="text-3xl font-bold text-white mb-2">AI SYSTEM TEST PANEL</h2>
        <p className="text-purple-300">Test the AI-powered humiliation system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testAIHumiliation}
          disabled={isLoading}
          className="px-6 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? "🤖 Testing..." : "🔥 Test AI Humiliation"}
        </button>
        
        <button
          onClick={testAITaunt}
          disabled={isLoading}
          className="px-6 py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? "🤖 Testing..." : "⚔️ Test AI Taunt"}
        </button>
      </div>

      {testResult && (
        <div className="bg-black border-2 border-purple-500 rounded-xl p-6">
          <h3 className="text-xl font-bold text-purple-400 mb-3">
            {testResult.type === "error" ? "❌ Error" : "✅ Test Result"}
          </h3>
          
          {testResult.type === "error" ? (
            <div className="text-red-400">
              <p><strong>Error:</strong> {testResult.data}</p>
              <p className="text-sm mt-2">
                This usually means you need to add API keys to your .env.local file.
                Check the AI_SETUP.md file for instructions.
              </p>
            </div>
          ) : testResult.type === "humiliation" ? (
            <div>
              <p className="text-white text-lg mb-2">
                <strong>AI-Generated Humiliation:</strong>
              </p>
              <p className="text-yellow-300 italic">
                "{testResult.data.message}"
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Generated at: {new Date(testResult.data.timestamp).toLocaleString()}
              </p>
            </div>
          ) : testResult.type === "taunt" ? (
            <div>
              <p className="text-white text-lg mb-2">
                <strong>AI-Generated Taunt:</strong>
              </p>
              <p className="text-yellow-300 italic">
                "{testResult.data.taunt}"
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Generated at: {new Date(testResult.data.timestamp).toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-lg font-bold text-white mb-2">🧪 Test Instructions:</h4>
        <ol className="text-gray-300 text-sm space-y-1">
          <li>1. <strong>Without API keys:</strong> You'll see fallback messages (still devastating!)</li>
          <li>2. <strong>With API keys:</strong> You'll get AI-generated personalized humiliation</li>
          <li>3. <strong>Test both buttons</strong> to see different AI responses</li>
          <li>4. <strong>Check console</strong> for any error details</li>
        </ol>
      </div>
    </div>
  );
}
