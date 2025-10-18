"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface HabitVerificationSystemProps {
  habitId: Id<"habits">;
  userId: Id<"users">;
  habitName: string;
  habitCategory: string;
  onVerificationComplete: () => void;
}

export default function HabitVerificationSystem({
  habitId,
  userId,
  habitName,
  habitCategory,
  onVerificationComplete,
}: HabitVerificationSystemProps) {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationType, setVerificationType] = useState<string>("");
  const [verificationData, setVerificationData] = useState<any>({});
  const [isVerifying, setIsVerifying] = useState(false);

  const completeHabit = useMutation(api.habits.completeHabit);
  const verifyHabitWithPhoto = useAction(api.groqVerificationActions.verifyHabitWithPhotoAction);
  const verifyHabitWithReading = useAction(api.groqVerificationActions.verifyHabitWithReadingAction);

  // Determine verification methods based on habit category
  const getVerificationMethods = () => {
    const baseMethods = [
      { id: "simple", name: "Simple Check-in", icon: "✅", description: "Quick self-verification" },
      { id: "photo", name: "Photo Evidence", icon: "📸", description: "Take a photo as proof" },
    ];

    // Add category-specific methods
    switch (habitCategory.toLowerCase()) {
      case "learning":
        return [
          ...baseMethods,
          { id: "reading", name: "Reading Summary", icon: "📚", description: "Summarize what you learned" },
          { id: "quiz", name: "Knowledge Quiz", icon: "🧠", description: "Test your understanding" },
        ];
      case "fitness":
        return [
          ...baseMethods,
          { id: "workout", name: "Workout Log", icon: "💪", description: "Log your workout details" },
          { id: "measurements", name: "Measurements", icon: "📏", description: "Record progress metrics" },
        ];
      case "health":
        return [
          ...baseMethods,
          { id: "vitals", name: "Health Metrics", icon: "❤️", description: "Record health data" },
          { id: "mood", name: "Mood Check", icon: "😊", description: "Rate your mood/energy" },
        ];
      case "productivity":
        return [
          ...baseMethods,
          { id: "task_list", name: "Task Completion", icon: "📋", description: "List completed tasks" },
          { id: "time_tracking", name: "Time Tracking", icon: "⏱️", description: "Log time spent" },
        ];
      case "mindfulness":
        return [
          ...baseMethods,
          { id: "reflection", name: "Reflection", icon: "🧘", description: "Write a reflection" },
          { id: "meditation", name: "Meditation Log", icon: "🕯️", description: "Log meditation session" },
        ];
      default:
        return baseMethods;
    }
  };

  const handleVerificationMethodSelect = (methodId: string) => {
    setVerificationType(methodId);
    setVerificationData({});
  };

  const handleSimpleVerification = async () => {
    setIsVerifying(true);
    try {
      await completeHabit({
        habitId,
        userId,
        points: 10, // Default points, could be dynamic
      });
      onVerificationComplete();
      setShowVerificationModal(false);
    } catch (error) {
      console.error("Error completing habit:", error);
      alert("Failed to complete habit: " + (error as Error).message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePhotoVerification = async () => {
    if (!verificationData.imageUrl) {
      alert("Please upload a photo first");
      return;
    }

    setIsVerifying(true);
    try {
      // Create a temporary completion for verification
      const completionResult = await completeHabit({
        habitId,
        userId,
        points: 10,
      });

      // Verify with AI
      const verificationResult = await verifyHabitWithPhoto({
        habitId,
        userId,
        imageUrl: verificationData.imageUrl,
        habitName,
        completionId: completionResult.completionId,
      });

      if (verificationResult.verified) {
        alert(`✅ Verification successful! Confidence: ${Math.round(verificationResult.confidence * 100)}%`);
        onVerificationComplete();
        setShowVerificationModal(false);
      } else {
        alert(`❌ Verification failed: ${verificationResult.reason}`);
      }
    } catch (error) {
      console.error("Error verifying habit:", error);
      alert("Failed to verify habit: " + (error as Error).message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReadingVerification = async () => {
    if (!verificationData.bookName || !verificationData.summary) {
      alert("Please fill in all required fields");
      return;
    }

    setIsVerifying(true);
    try {
      const completionResult = await completeHabit({
        habitId,
        userId,
        points: 10,
      });

      const verificationResult = await verifyHabitWithReading({
        habitId,
        userId,
        bookName: verificationData.bookName,
        pageRange: verificationData.pageRange || "N/A",
        summary: verificationData.summary,
        habitName,
        completionId: completionResult.completionId,
      });

      if (verificationResult.verified) {
        alert(`✅ Verification successful! Confidence: ${Math.round(verificationResult.confidence * 100)}%`);
        onVerificationComplete();
        setShowVerificationModal(false);
      } else {
        alert(`❌ Verification failed: ${verificationResult.reason}`);
      }
    } catch (error) {
      console.error("Error verifying habit:", error);
      alert("Failed to verify habit: " + (error as Error).message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a service like Cloudinary or AWS S3
      // For now, we'll create a data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setVerificationData({ ...verificationData, imageUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderVerificationForm = () => {
    switch (verificationType) {
      case "simple":
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Simple Check-in</h3>
            <p className="text-gray-600 mb-6">Just confirm you completed your habit today.</p>
            <button
              onClick={handleSimpleVerification}
              disabled={isVerifying}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isVerifying ? "Completing..." : "Mark as Complete"}
            </button>
          </div>
        );

      case "photo":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Photo Evidence</h3>
              <p className="text-gray-600">Take a photo that shows you completed your habit</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {verificationData.imageUrl && (
                <div className="mt-4">
                  <img
                    src={verificationData.imageUrl}
                    alt="Verification photo"
                    className="w-full max-w-sm mx-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handlePhotoVerification}
              disabled={isVerifying || !verificationData.imageUrl}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isVerifying ? "Verifying..." : "Verify with AI"}
            </button>
          </div>
        );

      case "reading":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reading Summary</h3>
              <p className="text-gray-600">Summarize what you learned from your reading</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book/Article Name
              </label>
              <input
                type="text"
                value={verificationData.bookName || ""}
                onChange={(e) => setVerificationData({ ...verificationData, bookName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Atomic Habits by James Clear"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pages Read (Optional)
              </label>
              <input
                type="text"
                value={verificationData.pageRange || ""}
                onChange={(e) => setVerificationData({ ...verificationData, pageRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Pages 1-25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary
              </label>
              <textarea
                value={verificationData.summary || ""}
                onChange={(e) => setVerificationData({ ...verificationData, summary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Write a brief summary of what you learned..."
                required
              />
            </div>

            <button
              onClick={handleReadingVerification}
              disabled={isVerifying || !verificationData.bookName || !verificationData.summary}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isVerifying ? "Verifying..." : "Verify with AI"}
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This verification method is not yet implemented.</p>
          </div>
        );
    }
  };

  return (
    <>
      <button
        onClick={() => setShowVerificationModal(true)}
        className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors text-lg flex items-center gap-2"
      >
        <span>✅</span>
        Complete Habit
      </button>

      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Verify Habit Completion</h2>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!verificationType ? (
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Verification Method</h3>
                    <p className="text-gray-600">How would you like to verify that you completed "{habitName}"?</p>
                  </div>

                  <div className="grid gap-4">
                    {getVerificationMethods().map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handleVerificationMethodSelect(method.id)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{method.icon}</span>
                          <div>
                            <div className="font-semibold text-gray-900">{method.name}</div>
                            <div className="text-sm text-gray-600">{method.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setVerificationType("")}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">Verification Method</h3>
                  </div>

                  {renderVerificationForm()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
