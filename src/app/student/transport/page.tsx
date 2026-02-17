"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENT TRANSPORT PAGE
 *
 * Students can:
 * - View their transport route allocation
 * - See bus schedule and stops
 * - Track bus location (real-time when available)
 * - View driver details
 * - Receive delay notifications
 */


import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  MapPin,
  Clock,
  User,
  Phone,
  Calendar,
  AlertCircle,
  Loader2,
  Navigation,
  Bell,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types with proper TypeScript - NO 'any'
interface RouteStop {
  name: string;
  location: { lat: string; lng: string };
  time: string;
  order?: number;
  morningPickup?: boolean;
  afternoonDrop?: boolean;
}

interface TransportRoute {
  id: string;
  routeNumber: string;
  routeName: string;
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  fee?: number;
  stops?: RouteStop[];
  morningStartTime?: string;
  afternoonEndTime?: string;
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  capacity?: number;
  driverName?: string;
  driverPhone?: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface TransportAllocation {
  id: string;
  studentId: string;
  routeId: string;
  vehicleId: string | null;
  pickupPoint: string;
  dropPoint: string;
  pickupTime: string;
  dropTime: string;
  status: string;
  route?: TransportRoute;
  vehicle?: Vehicle;
  driver?: Driver;
}

interface VehicleTracking {
  latitude: string | null;
  longitude: string | null;
  speed: number;
  heading: number;
  status: string;
  studentsOnBoard: number;
  lastUpdate: Date | string | null;
  message?: string;
}

interface DelayNotification {
  id: string;
  routeId: string;
  message: string;
  delayMinutes: number;
  estimatedArrival: string;
  createdAt: string;
  read: boolean;
}

export default function StudentTransportPage() {
  const [allocation, setAllocation] = useState<TransportAllocation | null>(null);
  const [tracking, setTracking] = useState<VehicleTracking | null>(null);
  const [notifications, setNotifications] = useState<DelayNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch transport allocation
  useEffect(() => {
    const fetchTransport = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/transport/allocations?action=my-allocation");
        const data = await response.json();

        if (data.allocation) {
          setAllocation(data.allocation);
          setHasTransport(true);

          // Fetch tracking data if vehicle is assigned
          if (data.allocation.vehicleId) {
            await fetchVehicleTracking(data.allocation.vehicleId);
          }

          // Fetch delay notifications
          await fetchNotifications(data.allocation.routeId);
        } else {
          setHasTransport(false);
        }
      } catch (error) {
        logger.error("Error fetching transport data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransport();

    // Set up polling for tracking updates (every 30 seconds)
    pollingRef.current = setInterval(() => {
      if (allocation?.vehicleId) {
        fetchVehicleTracking(allocation.vehicleId);
      }
      if (allocation?.routeId) {
        fetchNotifications(allocation.routeId);
      }
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Fetch vehicle tracking data
  const fetchVehicleTracking = async (vehicleId: string) => {
    try {
      setTrackingLoading(true);
      const response = await fetch(`/api/transport/tracking/${vehicleId}`);
      const data = await response.json();

      if (data.tracking) {
        setTracking(data.tracking);
      }
      setLastRefresh(new Date());
    } catch (error) {
      logger.error("Error fetching tracking data:", error);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Fetch delay notifications
  const fetchNotifications = async (routeId: string) => {
    try {
      const response = await fetch(`/api/transport/notifications?routeId=${routeId}`);
      const data = await response.json();

      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      logger.error("Error fetching notifications:", error);
    }
  };

  // Refresh tracking manually
  const handleRefresh = () => {
    if (allocation?.vehicleId) {
      fetchVehicleTracking(allocation.vehicleId);
    }
    if (allocation?.routeId) {
      fetchNotifications(allocation.routeId);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const formatTime = (time: string) => {
    if (!time) return "--:--";
    try {
      const [hours, minutes] = time.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const getTrackingStatusColor = (status: string) => {
    switch (status) {
      case "moving":
        return "text-green-600 bg-green-50";
      case "stopped":
        return "text-yellow-600 bg-yellow-50";
      case "idle":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-red-600 bg-red-50";
    }
  };

  const getTrackingStatusText = (status: string) => {
    switch (status) {
      case "moving":
        return "En Route";
      case "stopped":
        return "Stopped";
      case "idle":
        return "At School";
      default:
        return "Unknown";
    }
  };

  // Check if there are unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bus className="w-8 h-8 text-orange-600" />
            School Transport
          </h1>
          <p className="text-gray-600 mt-1">
            View your bus route, schedule, and tracking information
          </p>
        </div>
        {hasTransport && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={trackingLoading}
              className="relative"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${trackingLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </CardContent>
        </Card>
      ) : !hasTransport ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Transport Allocation
            </h3>
            <p className="text-gray-500 mb-4">
              You are not currently assigned to a school transport route.
              Please contact the school administration to request transport allocation.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Transport fees may apply based on distance.
                Check with school admin for fee structure.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Transport Overview Card */}
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white">
                    <Bus className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Route {allocation?.route?.routeNumber}
                    </h2>
                    <p className="text-gray-700">{allocation?.route?.routeName || allocation?.route?.name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(true)}
                  className="bg-white"
                >
                  View Details
                </Button>
              </div>

              {allocation?.route?.description && (
                <p className="text-gray-700 mt-4 max-w-2xl">
                  {allocation.route.description}
                </p>
              )}

              <div className="grid md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Morning Pickup</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    {formatTime(allocation.pickupTime)}
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Afternoon Drop</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    {formatTime(allocation.dropTime)}
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Pickup Point</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    {allocation.pickupPoint}
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Drop Point</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    {allocation.dropPoint}
                  </p>
                </div>
              </div>

              {allocation?.route?.fee && (
                <div className="mt-4 bg-white/80 rounded-lg p-3 inline-block">
                  <p className="text-sm text-gray-600">
                    Monthly Fee: <span className="font-bold text-gray-900">Nu. {allocation.route.fee}</span>
                  </p>
                </div>
              )}

              {lastRefresh && (
                <p className="text-xs text-gray-500 mt-3">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Real-time Tracking Card */}
          {tracking && (
            <Card className={tracking.status === "moving" ? "border-green-200 bg-green-50" : "border-gray-200"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  Live Bus Tracking
                </CardTitle>
                <CardDescription>
                  Real-time location of your assigned bus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getTrackingStatusColor(tracking.status)}`}>
                      {tracking.status === "moving" ? (
                        <Bus className="w-6 h-6" />
                      ) : tracking.status === "stopped" ? (
                        <Clock className="w-6 h-6" />
                      ) : (
                        <CheckCircle className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold text-gray-900">{getTrackingStatusText(tracking.status)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Students On Board</p>
                      <p className="font-semibold text-gray-900">{tracking.studentsOnBoard}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Update</p>
                      <p className="font-semibold text-gray-900">
                        {tracking.lastUpdate
                          ? new Date(tracking.lastUpdate).toLocaleTimeString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {tracking.message && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">{tracking.message}</p>
                  </div>
                )}

                {/* Delay Alerts */}
                {notifications.length > 0 &&
                  notifications.filter((n) => !n.read).length > 0 && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-800">
                        <AlertCircle className="w-5 h-5" />
                        <p className="font-semibold">
                          Active Delay Alert: {notifications[0].delayMinutes} minutes
                        </p>
                      </div>
                      <p className="text-sm text-orange-700 mt-1">{notifications[0].message}</p>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Driver & Vehicle Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allocation?.driver ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">
                        {allocation.driver.firstName} {allocation.driver.lastName}
                      </p>
                    </div>
                    {allocation.driver.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          {allocation.driver.phone}
                        </p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (allocation.driver?.phone) {
                          window.location.href = `tel:${allocation.driver.phone}`;
                        }
                      }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Driver
                    </Button>
                  </div>
                ) : allocation?.vehicle?.driverName ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">
                        {allocation.vehicle.driverName}
                      </p>
                    </div>
                    {allocation.vehicle.driverPhone && (
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          {allocation.vehicle.driverPhone}
                        </p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (allocation.vehicle?.driverPhone) {
                          window.location.href = `tel:${allocation.vehicle.driverPhone}`;
                        }
                      }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Driver
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500">Driver information not available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-blue-600" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allocation?.vehicle ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Vehicle Number</p>
                      <p className="font-medium text-gray-900">
                        {allocation.vehicle.registrationNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium text-gray-900">
                        {allocation.vehicle.vehicleType}
                      </p>
                    </div>
                    {allocation.vehicle.capacity && (
                      <div>
                        <p className="text-sm text-gray-600">Capacity</p>
                        <p className="font-medium text-gray-900">
                          {allocation.vehicle.capacity} students
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Vehicle information not available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Route Stops */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Route Stops
              </CardTitle>
              <CardDescription>
                Stops along {allocation?.route?.routeName || allocation?.route?.name || "your route"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Display stops from route */}
                {allocation?.route?.stops && allocation.route.stops.length > 0 ? (
                  <div className="space-y-3">
                    {allocation.route.stops.map((stop, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className={`w-3 h-3 rounded-full flex items-center justify-center text-xs font-bold mt-1 ${
                            stop.name === allocation.pickupPoint
                              ? "bg-green-500 text-white"
                              : stop.name === allocation.dropPoint
                              ? "bg-blue-500 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{stop.name}</p>
                          <p className="text-sm text-gray-500">Time: {formatTime(stop.time)}</p>
                        </div>
                        {stop.name === allocation.pickupPoint && (
                          <Badge className="bg-green-100 text-green-800">Pickup</Badge>
                        )}
                        {stop.name === allocation.dropPoint && (
                          <Badge className="bg-blue-100 text-blue-800">Drop</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mt-1">
                        {allocation?.pickupPoint?.[0] || "A"}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{allocation?.pickupPoint}</p>
                        <p className="text-sm text-gray-500">
                          Morning Pickup · {formatTime(allocation?.pickupTime || "")}
                        </p>
                      </div>
                    </div>

                    <div className="border-l border-gray-200 pl-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                          <Bus className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">En route to school...</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-1">
                          {allocation?.dropPoint?.[0] || "B"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{allocation?.dropPoint}</p>
                          <p className="text-sm text-gray-500">
                            Afternoon Drop · {formatTime(allocation?.dropTime || "")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Important Notices */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="w-5 h-5" />
                Important Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Be at your pickup point 5 minutes before the scheduled time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Inform the driver in advance if you will not be using transport on a particular day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Keep your school ID card with you while traveling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Contact the school immediately if the bus is running significantly late</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {/* Details Dialog */}
      {showDetails && allocation && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Transport Details - Route {allocation.route?.routeNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Route Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route Name:</span>
                    <span className="font-medium">{allocation.route?.routeName || allocation.route?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route Number:</span>
                    <span className="font-medium">{allocation.route?.routeNumber}</span>
                  </div>
                  {allocation.route?.fee && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Fee:</span>
                      <span className="font-medium">Nu. {allocation.route.fee}</span>
                    </div>
                  )}
                </div>
              </div>

              {allocation.vehicle && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vehicle Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration:</span>
                      <span className="font-medium">{allocation.vehicle.registrationNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{allocation.vehicle.vehicleType}</span>
                    </div>
                    {allocation.vehicle.capacity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">{allocation.vehicle.capacity} students</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(allocation.driver || allocation.vehicle?.driverName) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Driver Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">
                        {allocation.driver
                          ? `${allocation.driver.firstName} ${allocation.driver.lastName}`
                          : allocation.vehicle?.driverName}
                      </span>
                    </div>
                    {(allocation.driver?.phone || allocation.vehicle?.driverPhone) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-medium">
                          {allocation.driver?.phone || allocation.vehicle?.driverPhone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Notifications Dialog */}
      {showNotifications && (
        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Transport Notifications</DialogTitle>
              <DialogDescription>
                Updates about delays and route changes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.read
                        ? "bg-gray-50 border-gray-200"
                        : "bg-orange-50 border-orange-200"
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`w-5 h-5 mt-0.5 ${
                          notification.read ? "text-gray-400" : "text-orange-600"
                        }`}
                      />
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            notification.read ? "text-gray-700" : "text-gray-900"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Delay: {notification.delayMinutes} minutes
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
