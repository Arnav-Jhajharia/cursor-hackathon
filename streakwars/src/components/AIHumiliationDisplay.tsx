"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AIHumiliationDisplayProps {
  warId: string;
  winnerName: string;
  loserName: string;
  warStakes: number;
  winnerPoints: number;
  loserPoints: number;
  challengeName: string;
  warDuration: number;
}

export default function AIHumiliationDisplay({
  warId,
  winnerName,
  loserName,
  warStakes,
  winnerPoints,
  loserPoints,
  challengeName,
  warDuration,
}: AIHumiliationDisplayProps) {
  const [humiliationData, setHumiliationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSocialDestruction, setShowSocialDestruction] = useState(false);
  const [showVoiceHumiliation, setShowVoiceHumiliation] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const generateHumiliation = useAction(api.aiHumiliation.generateHumiliationMessage);
  const generateSocialDestruction = useAction(api.aiSocialDestruction.generateSocialDestruction);
  const generateVoiceHumiliation = useAction(api.aiHumiliation.generateVoiceHumiliation);

  const handleGenerateHumiliation = async () => {
    setIsLoading(true);
    try {
      const result = await generateHumiliation({
        winnerName,
        loserName,
        warStakes,
        winnerPoints,
        loserPoints,
        challengeName,
        warDuration,
      });
      setHumiliationData(result);
    } catch (error) {
      console.error("Error generating humiliation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSocialDestruction = async () => {
    if (!humiliationData) return;
    
    setIsLoading(true);
    try {
      const result = await generateSocialDestruction({
        loserName,
        winnerName,
        challengeName,
        warStakes,
        humiliationMessage: humiliationData.message,
      });
      setShowSocialDestruction(true);
      setHumiliationData(prev => ({ ...prev, socialDestruction: result }));
    } catch (error) {
      console.error("Error generating social destruction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVoiceHumiliation = async () => {
    if (!humiliationData) return;
    
    setIsLoading(true);
    try {
      const result = await generateVoiceHumiliation({
        humiliationText: humiliationData.message,
        voiceId: "pNInz6obpgDQGcFmaJgB", // Evil voice
      });
      
      if (result.audioData) {
        const audioBlob = new Blob([Buffer.from(result.audioData, 'base64')], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setShowVoiceHumiliation(true);
      }
    } catch (error) {
      console.error("Error generating voice humiliation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-900 to-black border-4 border-red-600 rounded-2xl p-8 mb-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🤖💀</div>
        <h2 className="text-3xl font-bold text-white mb-2">AI-POWERED HUMILIATION</h2>
        <p className="text-red-300">The most devastating defeat system ever created</p>
      </div>

      {/* Generate Humiliation Button */}
      {!humiliationData && (
        <div className="text-center mb-6">
          <button
            onClick={handleGenerateHumiliation}
            disabled={isLoading}
            className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-xl hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg"
          >
            {isLoading ? "🤖 AI is thinking..." : "🔥 GENERATE AI HUMILIATION 🔥"}
          </button>
        </div>
      )}

      {/* Humiliation Message */}
      {humiliationData && (
        <div className="mb-6">
          <div className="bg-black border-2 border-red-500 rounded-xl p-6 mb-4">
            <h3 className="text-xl font-bold text-red-400 mb-3">🤖 AI-Generated Humiliation:</h3>
            <p className="text-white text-lg leading-relaxed">
              {humiliationData.message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleGenerateSocialDestruction}
              disabled={isLoading || showSocialDestruction}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "🤖 Generating..." : "🌐 SOCIAL DESTRUCTION"}
            </button>
            
            <button
              onClick={handleGenerateVoiceHumiliation}
              disabled={isLoading || showVoiceHumiliation}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "🤖 Generating..." : "🎤 VOICE HUMILIATION"}
            </button>
          </div>

          {/* Voice Humiliation */}
          {showVoiceHumiliation && audioUrl && (
            <div className="bg-purple-900 border-2 border-purple-500 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold text-purple-400 mb-3">🎤 AI Voice Humiliation:</h3>
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <p className="text-purple-300 text-sm mt-2">
                Listen to the AI-generated voice humiliation. Absolutely devastating! 💀
              </p>
            </div>
          )}

          {/* Social Destruction */}
          {showSocialDestruction && humiliationData.socialDestruction && (
            <div className="bg-blue-900 border-2 border-blue-500 rounded-xl p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-4">🌐 Social Media Destruction:</h3>
              
              {humiliationData.socialDestruction.socialPosts?.map((post: any, index: number) => (
                <div key={index} className="bg-black border border-blue-400 rounded-lg p-4 mb-3">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-400 font-bold">{post.platform}:</span>
                  </div>
                  <p className="text-white">{post.content}</p>
                </div>
              ))}

              {humiliationData.socialDestruction.memeCaption && (
                <div className="bg-black border border-blue-400 rounded-lg p-4 mt-4">
                  <div className="text-blue-400 font-bold mb-2">🎭 Meme Caption:</div>
                  <p className="text-white">{humiliationData.socialDestruction.memeCaption}</p>
                </div>
              )}

              <div className="mt-4 p-4 bg-red-900 border border-red-500 rounded-lg">
                <p className="text-red-300 text-sm">
                  ⚠️ <strong>WARNING:</strong> This content is designed to be absolutely devastating and humiliating. 
                  Use with extreme caution. The psychological damage may be permanent. 💀
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* War Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-400">{winnerPoints}</div>
          <div className="text-sm text-gray-400">Winner Points</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-400">{loserPoints}</div>
          <div className="text-sm text-gray-400">Loser Points</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-400">{warStakes}</div>
          <div className="text-sm text-gray-400">Stakes</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-400">{warDuration}d</div>
          <div className="text-sm text-gray-400">Duration</div>
        </div>
      </div>
    </div>
  );
}
