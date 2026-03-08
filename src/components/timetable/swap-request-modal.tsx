/**
 * SWAP REQUEST MODAL
 *
 * A beautiful modal for teachers to request, accept, or reject schedule swaps
 * with their colleagues. Part of the peer-to-peer swap functionality.
 *
 * Features:
 * - Animated swap visualization
 * - One-click accept/reject
 * - Alternative proposal support
 * - AI compatibility score display
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeftRight,
  User,
  Calendar,
  Clock,
  AlertCircle,
  Check,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "request" | "respond" | "success";
  requestData?: {
    requesterId: string;
    requesterName: string;
    targetId: string;
    targetName: string;
    requesterPeriod: { day: string; period: number; startTime: string; endTime: string; subject: string; class: string };
    targetPeriod?: { day: string; period: number; startTime: string; endTime: string; subject: string; class: string };
    reason: "emergency" | "medical" | "personal" | "preference";
    aiCompatibilityScore?: number;
  };
  onRequest?: (message: string) => void;
  onResponse?: (response: "accept" | "reject", alternativeProposal?: { day: string; period: number }) => void;
  swapRequest?: {
    id: string;
    status: "pending" | "accepted" | "rejected" | "completed";
    message: string;
  };
}

// ============================================================================
// MODAL VARIATIONS
// ============================================================================

export function SwapRequestModal({
  isOpen,
  onClose,
  type,
  requestData,
  onRequest,
  onResponse,
  swapRequest,
}: SwapRequestModalProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState<{ day: string; period: number } | null>(null);

  if (!isOpen) return null;

  // REQUEST MODE - Teacher wants to swap their period
  if (type === "request") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y:20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Request Schedule Swap</h2>
                  <p className="text-violet-200 text-sm">Find a colleague to trade with</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Swap Preview */}
            <div className="flex items-center justify-between p-4 bg-violet-50 rounded-xl border border-violet-100">
              {/* Your Period */}
              <div className="text-center">
                <p className="text-xs text-violet-600 mb-1">Your Period</p>
                <p className="text-sm font-semibold text-violet-900">{requestData?.requesterPeriod.day}</p>
                <p className="text-lg font-bold text-violet-700">{requestData?.requesterPeriod.period}</p>
                <p className="text-xs text-gray-500">{requestData?.requesterPeriod.startTime}</p>
                <Badge className="mt-1" variant="secondary">{requestData?.requesterPeriod.subject}</Badge>
              </div>

              {/* Swap Icon */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="text-violet-400"
              >
                <ArrowLeftRight className="w-6 h-6" />
              </motion.div>

              {/* Target Period */}
              <div className="text-center">
                <p className="text-xs text-violet-600 mb-1">Wanted Period</p>
                <p className="text-sm font-semibold text-violet-900">{requestData?.targetPeriod?.day || "Any"}</p>
                <p className="text-lg font-bold text-violet-700">{requestData?.targetPeriod?.period || "?"}</p>
                <p className="text-xs text-gray-500">{requestData?.targetPeriod?.startTime || "TBD"}</p>
              </div>
            </div>

            {/* AI Compatibility Score */}
            {requestData?.aiCompatibilityScore && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  AI Match Score: {requestData.aiCompatibilityScore}%
                </span>
              </div>
            )}

            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Swap</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "emergency", label: "Emergency", icon: AlertCircle, color: "red" },
                  { value: "medical", label: "Medical", icon: AlertCircle, color: "orange" },
                  { value: "personal", label: "Personal", icon: User, color: "blue" },
                  { value: "preference", label: "Preference", icon: Check, color: "green" },
                ].map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => setMessage(`${reason.label}: `)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all hover:shadow-md",
                      message.includes(reason.label) && `border-${reason.color}-500 bg-${reason.color}-50`
                    )}
                  >
                    <reason.icon className="w-4 h-4 mb-1" />
                    <span className="text-sm font-medium">{reason.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message for your colleague..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
              />
            </div>

            {/* Target Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send Request To
              </label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20">
                <option value={requestData?.targetId}>{requestData?.targetName}</option>
              </select>
            </div>

            {/* Action Button */}
            <Button
              onClick={() => onRequest && onRequest(message)}
              disabled={!message || isSubmitting}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Swap Request
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // RESPOND MODE - Teacher received a swap request
  if (type === "respond") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Swap Request</h2>
                  <p className="text-blue-200 text-sm">{requestData?.requesterName} wants to swap with you</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Swap Details */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
              {/* Their Period */}
              <div className="text-center">
                <p className="text-xs text-blue-600 mb-1">Their Period</p>
                <p className="text-sm font-semibold text-blue-900">{requestData?.requesterPeriod.day}</p>
                <p className="text-lg font-bold text-blue-700">{requestData?.requesterPeriod.period}</p>
                <p className="text-xs text-gray-500">{requestData?.requesterPeriod.startTime}</p>
                <Badge variant="secondary" className="mt-1">{requestData?.requesterPeriod.subject}</Badge>
              </div>

              <ArrowLeftRight className="text-blue-400" />

              {/* Your Period */}
              <div className="text-center">
                <p className="text-xs text-blue-600 mb-1">Your Period</p>
                <p className="text-sm font-semibold text-blue-900">{requestData?.targetPeriod?.day || "Any"}</p>
                <p className="text-lg font-bold text-blue-700">{requestData?.targetPeriod?.period || "?"}</p>
                <p className="text-xs text-gray-500">{requestData?.targetPeriod?.startTime || "TBD"}</p>
              </div>
            </div>

            {/* Reason */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Reason:</span> {requestData?.reason}
              </p>
              {swapRequest?.message && (
                <p className="text-sm text-gray-500 mt-1 italic">"{swapRequest.message}"</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => onResponse && onResponse("reject")}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                onClick={() => onResponse && onResponse("accept")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Accept Swap
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // SUCCESS MODE - Swap completed
  if (type === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 0, -10, 10] }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-8 h-8 text-green-600" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Swap Completed!</h2>
          <p className="text-gray-600 mb-6">Your schedule has been updated successfully.</p>
          <Button onClick={onClose} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            Done
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return null;
}

// ============================================================================
// SWAP NOTIFICATION BADGE
// ============================================================================

interface SwapNotificationBadgeProps {
  count: number;
  onClick?: () => void;
}

export function SwapNotificationBadge({ count, onClick }: SwapNotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1 }}
      className="relative"
    >
      <div className="absolute -top-1 -right-1">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"
        />
      </div>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
        <ArrowLeftRight className="w-4 h-4" />
      </div>
      {count > 1 && (
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </motion.button>
  );
}
