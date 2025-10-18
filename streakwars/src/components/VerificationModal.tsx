"use client";

import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface VerificationModalProps {
  completionId: Id<"habitCompletions">;
  habitName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VerificationModal({ 
  completionId, 
  habitName, 
  isOpen, 
  onClose 
}: VerificationModalProps) {
  const [verificationType, setVerificationType] = useState<"photo" | "reading">("photo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Photo verification data
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedImageData, setCompressedImageData] = useState<string | null>(null);
  
  // Reading verification data
  const [bookName, setBookName] = useState("");
  const [pageRange, setPageRange] = useState("");
  const [summary, setSummary] = useState("");

  const submitVerification = useMutation(api.habitVerification.submitHabitVerification);

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size must be less than 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }
      
      setImageFile(file);
      setImageUrl(""); // Clear URL if file is selected
      
      try {
        // Compress the image to reduce size
        const compressedDataUrl = await compressImage(file);
        setImagePreview(compressedDataUrl);
        setCompressedImageData(compressedDataUrl);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original file
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setImagePreview(dataUrl);
          setCompressedImageData(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let verificationData: any = {};

      if (verificationType === "photo") {
        if (imageFile && compressedImageData) {
          // Use compressed image data
          verificationData = { imageUrl: compressedImageData };
        } else if (imageUrl) {
          verificationData = { imageUrl };
        } else {
          alert("Please provide either an image file or image URL");
          setIsSubmitting(false);
          return;
        }
      } else {
        verificationData = { bookName, pageRange, summary };
      }

      await submitVerification({
        completionId,
        verificationType,
        verificationData,
      });

      onClose();
      // Reset form
      setImageUrl("");
      setImageFile(null);
      setImagePreview(null);
      setCompressedImageData(null);
      setBookName("");
      setPageRange("");
      setSummary("");
    } catch (error) {
      console.error("Error submitting verification:", error);
      alert("Failed to submit verification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidForm = () => {
    if (verificationType === "photo") {
      return imageUrl.trim() !== "" || imageFile !== null;
    } else {
      return bookName.trim() !== "" && pageRange.trim() !== "" && summary.trim() !== "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Verify "{habitName}"
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Verification Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Method
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setVerificationType("photo")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  verificationType === "photo"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📸 Photo
              </button>
              <button
                onClick={() => setVerificationType("reading")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  verificationType === "reading"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📚 Reading
              </button>
            </div>
          </div>

          {/* Photo Verification Form */}
          {verificationType === "photo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: 10MB
                </p>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
              
              <div className="text-center text-gray-500 text-sm">OR</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFile(null); // Clear file if URL is entered
                    setImagePreview(null);
                    setCompressedImageData(null);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload your image to a service like Imgur, then paste the URL here
                </p>
              </div>
            </div>
          )}

          {/* Reading Verification Form */}
          {verificationType === "reading" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Book Name
                </label>
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder="e.g., Atomic Habits"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pages Read
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g., 1-25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of what you read..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValidForm() || isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isValidForm() && !isSubmitting
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Verifying..." : "Submit Verification"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
