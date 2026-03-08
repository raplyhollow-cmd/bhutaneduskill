/**
 * TRANSPORT TRACKING API
 *
 * GET /api/transport/tracking/[vehicleId]
 * Returns real-time tracking information for a school transport vehicle
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, notFoundResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ vehicleId: string }> }) => {
    const { userId } = auth;
    const { vehicleId } = await context.params;

    // In a real implementation, this would:
    // 1. Query the transport allocations table
    // 2. Get real-time GPS data from the transport system
    // 3. Return the current location and ETA

    // Mock response for demo
    const trackingData = {
      vehicleId,
      vehicleNumber: "BT-1-1234",
      driverName: "Karma Wangchuk",
      driverPhone: "+975 17 123 456",
      currentLocation: {
        latitude: 27.4712,
        longitude: 89.6419,
        address: "Near Clock Tower, Thimphu",
      },
      status: "en_route", // en_route, at_stop, at_school, completed
      estimatedArrival: new Date(Date.now() + 15 * 60000).toISOString(), // 15 minutes from now
      route: {
        id: "route_001",
        name: "Thimphu Town Route",
        stops: [
          { id: "stop_1", name: "Memorial Chorten", time: "07:30", status: "completed" },
          { id: "stop_2", name: "Clock Tower", time: "07:40", status: "current" },
          { id: "stop_3", name: "School Gate", time: "07:55", status: "pending" },
        ],
      },
      passengers: {
        capacity: 20,
        onBoard: 15,
        pickedUp: 12,
        droppedOff: 0,
      },
    };

    return successResponse({
      success: true,
      tracking: trackingData,
    });
  },
  ['student', 'parent', 'teacher', 'admin']
);
