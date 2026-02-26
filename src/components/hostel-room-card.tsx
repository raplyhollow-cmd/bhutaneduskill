"use client";

/**
 * HOSTEL ROOM CARD COMPONENT
 *
 * Displays:
 * - Room number and floor
 * - Capacity and occupancy
 * - Room type and status
 * - Quick allocate action
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bed,
  Users,
  MapPin,
  DoorOpen,
  Wifi,
  Shield,
  Check,
  X,
  Plus,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface HostelRoomCardProps {
  room: {
    id: string;
    roomNumber: string;
    floor: number;
    roomType: string;
    capacity: number;
    occupiedBeds: number;
    status: string;
    hostelId: string;
  };
  hostel?: {
    id: string;
    name: string;
    code?: string;
    type: string;
  };
  onAllocate?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function HostelRoomCard({ room, hostel, onAllocate }: HostelRoomCardProps) {
  const occupancyPercentage = room.capacity > 0 ? (room.occupiedBeds / room.capacity) * 100 : 0;
  const isFull = room.occupiedBeds >= room.capacity;
  const isAvailable = room.status === "available" && !isFull;

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single: "Single (1 bed)",
      double: "Double (2 beds)",
      triple: "Triple (3 beds)",
      dormitory: "Dormitory (4+ beds)",
      suite: "Suite",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "full":
        return "bg-red-100 text-red-800 border-red-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "unavailable":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{room.roomNumber}</CardTitle>
              <Badge variant="outline" className={getStatusColor(room.status)}>
                {room.status}
              </Badge>
            </div>
            {hostel && (
              <p className="text-sm text-gray-600 mt-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                {hostel.name} ({hostel.code})
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Room Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Type</span>
          <span className="text-sm font-medium capitalize">{getRoomTypeLabel(room.roomType)}</span>
        </div>

        {/* Floor */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Floor</span>
          <span className="text-sm font-medium">{room.floor}</span>
        </div>

        {/* Capacity & Occupancy */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Occupancy</span>
            </div>
            <span className="text-sm font-medium">
              {room.occupiedBeds} / {room.capacity}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                occupancyPercentage >= 100
                  ? "bg-red-500"
                  : occupancyPercentage >= 75
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {occupancyPercentage >= 100
              ? "Fully occupied"
              : occupancyPercentage >= 75
              ? "High occupancy"
              : occupancyPercentage >= 50
              ? "Moderate occupancy"
              : "Low occupancy"}
          </p>
        </div>

        {/* Available Beds */}
        {isAvailable && (
          <div className="flex items-center gap-2 text-sm text-green-600 pt-2 border-t">
            <Check className="w-4 h-4" />
            <span>{room.capacity - room.occupiedBeds} bed(s) available</span>
          </div>
        )}

        {/* Allocate Button */}
        {onAllocate && isAvailable && (
          <Button
            onClick={onAllocate}
            className="w-full mt-3"
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Allocate Bed
          </Button>
        )}

        {!isAvailable && (
          <Button
            disabled
            className="w-full mt-3"
            variant="outline"
          >
            <X className="w-4 h-4 mr-2" />
            {isFull ? "Room Full" : "Unavailable"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
