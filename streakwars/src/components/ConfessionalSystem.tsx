"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ConfessionalSystemProps {
  userId: Id<"users">;
  habitId: Id<"habits">;
  habitName: string;
  streakLength: number;
  isAntiConfessional?: boolean;
  friendId?: Id<"users">;
  onComplete?: () => void;
}

export default function ConfessionalSystem({
  userId,
  habitId,
  habitName,
  streakLength,
  isAntiConfessional = false,
  friendId,
  onComplete,
}: ConfessionalSystemProps) {
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confessionText, setConfessionText] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Convex hooks
  const triggerConfessional = useMutation(api.confessional.triggerConfessional);
  const triggerAntiConfessional = useMutation(api.confessional.triggerAntiConfessional);
  const processVideo = useAction(api.falAiActions.processConfessionalVideo);
  const scenarios = useQuery(api.confessional.getConfessionalScenarios, { 
    isAntiConfessional 
  });

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleSubmitConfession = async () => {
    if (!recordedVideo || !selectedScenario) {
      alert("Please record a video and select a scenario first.");
      return;
    }

    setIsProcessing(true);

    try {
      // Convert blob to file and upload (in a real app, you'd upload to a storage service)
      const blob = await fetch(recordedVideo).then(r => r.blob());
      const videoFile = new File([blob], "confession.webm", { type: "video/webm" });
      
      // For now, we'll use a placeholder URL
      const confessionVideoUrl = "https://example.com/confessions/" + Date.now() + ".webm";

      // Create confessional record
      const result = isAntiConfessional 
        ? await triggerAntiConfessional({
            userId,
            habitId,
            habitName,
            streakLength,
            milestone: `${streakLength} days`
          })
        : await triggerConfessional({
            userId,
            habitId,
            habitName,
            streakLength,
            friendId
          });

      // Process the video with deepfake
      const processResult = await processVideo({
        confessionVideoUrl,
        scenarioId: selectedScenario.id,
        userId,
        confessionalId: result.confessionalId
      });

      if (processResult.success) {
        alert(`🎬 Your ${isAntiConfessional ? 'victory' : 'confessional'} video is being processed! Check back in a few minutes.`);
        setShowModal(false);
        onComplete?.();
      } else {
        alert(`Error processing video: ${processResult.error}`);
      }
    } catch (error) {
      console.error("Error submitting confession:", error);
      alert("Error submitting confession. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfessionPrompt = () => {
    if (isAntiConfessional) {
      return `🎉 Congratulations! You've maintained your ${streakLength}-day streak for "${habitName}"! 
      
Record a victory video celebrating your achievement. Be proud and dramatic!`;
    } else {
      return `😔 Your ${streakLength}-day streak for "${habitName}" has been broken!
      
Record a confessional video explaining what happened. Be honest and dramatic!`;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`px-6 py-3 rounded-xl font-semibold text-sm transition-colors ${
          isAntiConfessional
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
      >
        {isAntiConfessional ? "🎉 Record Victory Video" : "😔 Record Confession"}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isAntiConfessional ? "🎉 Victory Confessional" : "😔 Confessional"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Confession Prompt */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {getConfessionPrompt()}
                  </p>
                </div>

                {/* Video Recording Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Record Your Video</h3>
                  
                  <div className="bg-gray-100 rounded-xl p-4 aspect-video flex items-center justify-center">
                    {recordedVideo ? (
                      <video
                        src={recordedVideo}
                        controls
                        className="max-w-full max-h-full rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📹</div>
                        <p>Your video will appear here</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 justify-center">
                    {!isRecording && !recordedVideo && (
                      <button
                        onClick={handleStartRecording}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                      >
                        🎬 Start Recording
                      </button>
                    )}
                    
                    {isRecording && (
                      <button
                        onClick={handleStopRecording}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                      >
                        ⏹️ Stop Recording
                      </button>
                    )}
                    
                    {recordedVideo && (
                      <button
                        onClick={() => {
                          setRecordedVideo(null);
                          setSelectedScenario(null);
                        }}
                        className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                      >
                        🔄 Record Again
                      </button>
                    )}
                  </div>

                  {/* Hidden video element for recording */}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="hidden"
                  />
                </div>

                {/* Scenario Selection */}
                {recordedVideo && scenarios && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Choose Your {isAntiConfessional ? 'Victory' : 'Confession'} Scenario
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {scenarios.map((scenario) => (
                        <button
                          key={scenario.id}
                          onClick={() => setSelectedScenario(scenario)}
                          className={`p-4 rounded-xl border-2 transition-colors text-left ${
                            selectedScenario?.id === scenario.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="font-semibold text-gray-900 mb-1">
                            {scenario.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {scenario.description}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Intensity: {scenario.intensity}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                {recordedVideo && selectedScenario && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleSubmitConfession}
                      disabled={isProcessing}
                      className={`px-8 py-4 rounded-xl font-semibold text-lg transition-colors ${
                        isProcessing
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : isAntiConfessional
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {isProcessing ? (
                        "🎬 Processing Video..."
                      ) : (
                        `🎬 Create ${isAntiConfessional ? 'Victory' : 'Confession'} Video`
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
