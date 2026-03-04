"use client";

/**
 * LIVE SESSION COMPONENT
 * Real-time video session interface for tuition
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Hand,
  Settings,
  Maximize2,
  Minimize2,
  Clock,
  Circle,
} from "lucide-react";

export interface SessionParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: "tutor" | "student";
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
}

export interface LiveSessionData {
  id: string;
  courseId: string;
  courseName: string;
  tutorId: string;
  tutorName: string;

  title: string;
  description?: string;

  startTime: string;
  endTime?: string;
  duration: number; // in minutes

  isRecorded: boolean;

  participants: SessionParticipant[];
  maxParticipants: number;

  chatMessages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: string;
  }>;
}

interface LiveSessionProps {
  session: LiveSessionData;
  currentUserId: string;
  onEnd?: () => void | Promise<void>;
}

/**
 * Format message timestamp consistently to avoid hydration mismatches
 */
function formatMessageTime(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export function LiveSession({ session, currentUserId, onEnd }: LiveSessionProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);

  // Timer
  useEffect(() => {
    const startTime = new Date(session.startTime).getTime();
    const endTime = session.endTime
      ? new Date(session.endTime).getTime()
      : startTime + session.duration * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);

      if (remaining === 0 && onEnd) {
        onEnd();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session, onEnd]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);
  const toggleScreenShare = () => setIsScreenSharing(!isScreenSharing);
  const toggleRecording = () => setIsRecording(!isRecording);
  const toggleHand = () => setIsHandRaised(!isHandRaised);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    // In production, send to WebSocket
    setChatInput("");
  };

  const currentUser = session.participants.find((p) => p.id === currentUserId);
  const isTutor = session.tutorId === currentUserId;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-semibold">{session.title}</h1>
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">
            <Circle className="w-3 h-3 mr-1 animate-pulse" />
            LIVE
          </Badge>
          {isRecording && (
            <Badge className="bg-red-600 text-white">
              <Circle className="w-3 h-3 mr-1" />
              Recording
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeRemaining)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{session.participants.length}/{session.maxParticipants}</span>
          </div>

          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
            <Settings className="w-5 h-5" />
          </Button>

          {onEnd && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onEnd}
              className="ml-2"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              End
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col p-4">
          {/* Main Video (Tutor or Screen Share) */}
          <div className="flex-1 relative bg-gray-800 rounded-lg overflow-hidden">
            {isScreenSharing ? (
              <video
                ref={screenShareRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}

            {/* Participant Name Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
              {isScreenSharing ? "Screen Share" : session.tutorName}
            </div>
          </div>

          {/* Participant Grid */}
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {/* Local Video */}
            <div className="relative w-48 h-36 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <span className="text-white text-2xl font-bold">
                    {currentUser?.name.split(" ").map((n) => n[0]).join("") || "You"}
                  </span>
                </div>
              )}
              {isMuted && (
                <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                You
              </div>
            </div>

            {/* Other Participants */}
            {session.participants
              .filter((p) => p.id !== currentUserId)
              .slice(0, 5)
              .map((participant) => (
                <div
                  key={participant.id}
                  className="relative w-48 h-36 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0"
                >
                  {participant.isVideoOff ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <span className="text-white text-2xl font-bold">
                        {participant.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <span className="text-white text-2xl font-bold">
                        {participant.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                  )}

                  {participant.isMuted && (
                    <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {participant.isHandRaised && (
                    <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1">
                      <Hand className="w-3 h-3 text-white" />
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                    {participant.role === "tutor" && (
                      <Badge className="bg-blue-500 text-white text-xs px-1 py-0">
                        Tutor
                      </Badge>
                    )}
                    {participant.name}
                  </div>
                </div>
              ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              variant={isVideoOff ? "destructive" : "secondary"}
              size="icon"
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="icon"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </Button>

            <Button
              variant="secondary"
              size="icon"
              onClick={toggleHand}
              className={isHandRaised ? "bg-yellow-500 hover:bg-yellow-600" : ""}
            >
              <Hand className="w-5 h-5" />
            </Button>

            <div className="w-px h-8 bg-gray-700 mx-2" />

            <Button
              variant={isRecording ? "destructive" : "secondary"}
              size="icon"
              onClick={toggleRecording}
            >
              <Circle className="w-5 h-5" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="w-5 h-5" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>

            <Button variant="secondary" size="icon">
              <Maximize2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Side Panel */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => { setShowChat(true); setShowParticipants(false); }}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  showChat ? "text-white border-b-2 border-primary" : "text-gray-400"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => { setShowChat(false); setShowParticipants(true); }}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  showParticipants ? "text-white border-b-2 border-primary" : "text-gray-400"
                }`}
              >
                Participants ({session.participants.length})
              </button>
            </div>

            {/* Chat */}
            {showChat && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {session.chatMessages.map((msg) => (
                    <div key={msg.id}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-white">
                          {msg.senderName}
                        </span>
                        <span className="text-xs text-gray-500" suppressHydrationWarning>
                          {formatMessageTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{msg.message}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      placeholder="Type a message..."
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                    <Button
                      size="icon"
                      onClick={sendChat}
                      disabled={!chatInput.trim()}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            {showParticipants && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {session.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-700"
                    >
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold">
                        {participant.name.split(" ").map((n) => n[0]).join("")}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {participant.name}
                          </p>
                          {participant.role === "tutor" && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              Tutor
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {participant.isMuted && (
                            <MicOff className="w-3 h-3 text-red-400" />
                          )}
                          {participant.isVideoOff && (
                            <VideoOff className="w-3 h-3 text-red-400" />
                          )}
                          {participant.isHandRaised && (
                            <Hand className="w-3 h-3 text-yellow-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
