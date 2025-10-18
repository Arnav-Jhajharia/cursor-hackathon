"use client";

import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface ChallengeShareModalProps {
  challengeId: Id<"challenges">;
  inviteCode: string;
  challengeName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChallengeShareModal({ 
  challengeId, 
  inviteCode, 
  challengeName, 
  isOpen, 
  onClose 
}: ChallengeShareModalProps) {
  const [copied, setCopied] = useState(false);
  
  const inviteLink = `${window.location.origin}/join/${inviteCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Share Challenge</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{challengeName}</h4>
            <p className="text-sm text-gray-600">Share this challenge with friends</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Invite Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inviteCode}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-center"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {copied ? "✓" : "📋"}
              </button>
            </div>
          </div>

          {/* Share Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <button
              onClick={() => {
                const text = `Join my challenge "${challengeName}" on Habituate! Use code: ${inviteCode} or visit: ${inviteLink}`;
                const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
              }}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>📱</span>
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={() => {
                const text = `Join my challenge "${challengeName}" on Habituate! Use code: ${inviteCode} or visit: ${inviteLink}`;
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
              }}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span>🐦</span>
              <span>Share on Twitter</span>
            </button>

            <button
              onClick={() => {
                const text = `Join my challenge "${challengeName}" on Habituate! Use code: ${inviteCode} or visit: ${inviteLink}`;
                const url = `mailto:?subject=Join my Habituate Challenge&body=${encodeURIComponent(text)}`;
                window.open(url);
              }}
              className="w-full py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>📧</span>
              <span>Share via Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
