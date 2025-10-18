"use client";

interface ConfidenceBarProps {
  confidence: number;
  verified: boolean;
  className?: string;
}

export default function ConfidenceBar({ confidence, verified, className = "" }: ConfidenceBarProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceTextColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-700";
    if (confidence >= 0.6) return "text-yellow-700";
    return "text-red-700";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  const percentage = Math.round(confidence * 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getConfidenceColor(confidence)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center gap-1 min-w-0">
        <span className={`text-xs font-medium ${getConfidenceTextColor(confidence)}`}>
          {percentage}%
        </span>
        <span className={`text-xs ${getConfidenceTextColor(confidence)}`}>
          ({getConfidenceLabel(confidence)})
        </span>
        {verified ? (
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}
