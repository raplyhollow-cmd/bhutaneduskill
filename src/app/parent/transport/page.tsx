"use client";

import { logger } from "@/lib/logger";
/**
 * PARENT TRANSPORT TRACKING PAGE
 *
 * Parents can:
 * - View their child's transport allocation
 * - Track bus location in real-time
 * - View route and schedule details
 * - Contact driver
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
  Baby,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types with proper TypeScript
interface RouteStop {
  name: string;
  location: { lat: string; lng: string };
  time: string;
  order?: number;
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

interface ChildTransportAllocation {
  childId: string;
  childName: string;
  allocation: {
    id: string;
    pickupPoint: string;
    dropPoint: string;
    pickupTime: string;
    dropTime: string;
    status: string;
    fee?: number;
    isPaid?: boolean;
    route?: TransportRoute;
    vehicle?: Vehicle;
    driver?: Driver;
  };
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

export default function ParentTransportPage() {
  const [childrenAllocations, setChildrenAllocations] = useState<ChildTransportAllocation[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [tracking, setTracking] = useState<Record<string, VehicleTracking>>({});
  const [notifications, setNotifications] = useState<Record<string, DelayNotification[]>>({});
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch children's transport data
  useEffect(() => {
    const fetchChildrenTransport = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/parent/transport");
        const data = await response.json();

        if (data.children && data.children.length > 0) {
          const allocations = data.children.map((child: {
            id: string;
            firstName: string;
            lastName: string;
            transportAllocation?: unknown;
          }) => ({
            childId: child.id,
            childName: `${child.firstName} ${child.lastName}`.trim(),
            allocation: child.transportAllocation as ChildTransportAllocation["allocation"],
          }));

          // Filter only children with transport
          const childrenWithTransport = allocations.filter(
            (a: ChildTransportAllocation) => a.allocation
          );

          setChildrenAllocations(childrenWithTransport);
          setHasTransport(childrenWithTransport.length > 0);

          if (childrenWithTransport.length > 0) {
            setSelectedChildId(childrenWithTransport[0].childId);

            // Fetch tracking data for each child
            for (const child of childrenWithTransport) {
              if (child.allocation?.vehicle?.id) {
                await fetchVehicleTracking(child.childId, child.allocation.vehicle.id);
              }
              if (child.allocation?.route?.id) {
                await fetchNotifications(child.childId, child.allocation.route.id);
              }
            }
          }
        } else {
          setHasTransport(false);
        }
      } catch (error) {
        logger.error("Error fetching children transport data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildrenTransport();

    // Set up polling for tracking updates (every 30 seconds)
    pollingRef.current = setInterval(() => {
      childrenAllocations.forEach((child) => {
        if (child.allocation?.vehicle?.id) {
          fetchVehicleTracking(child.childId, child.allocation.vehicle.id);
        }
        if (child.allocation?.route?.id) {
          fetchNotifications(child.childId, child.allocation.route.id);
        }
      });
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Fetch vehicle tracking data
  const fetchVehicleTracking = async (childId: string, vehicleId: string) => {
    try {
      setTrackingLoading(true);
      const response = await fetch(`/api/transport/tracking/${vehicleId}`);
      const data = await response.json();

      if (data.tracking) {
        setTracking((prev) => ({ ...prev, [childId]: data.tracking }));
      }
      setLastRefresh(new Date());
    } catch (error) {
      logger.error("Error fetching tracking data:", error);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Fetch delay notifications
  const fetchNotifications = async (childId: string, routeId: string) => {
    try {
      const response = await fetch(`/api/transport/notifications?routeId=${routeId}`);
      const data = await response.json();

      if (data.notifications) {
        setNotifications((prev) => ({ ...prev, [childId]: data.notifications }));
      }
    } catch (error) {
      logger.error("Error fetching notifications:", error);
    }
  };

  // Refresh tracking manually
  const handleRefresh = () => {
    const selectedChild = childrenAllocations.find((c) => c.childId === selectedChildId);
    if (selectedChild?.allocation?.vehicle?.id) {
      fetchVehicleTracking(selectedChildId, selectedChild.allocation.vehicle.id);
    }
    if (selectedChild?.allocation?.route?.id) {
      fetchNotifications(selectedChildId, selectedChild.allocation.route.id);
    }
  };

  // Mark notification as read
  const markAsRead = (childId: string, notificationId: string) => {
    setNotifications((prev) => ({
      ...prev,
      [childId]: prev[childId]?.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ) || [],
    }));
  };

  // Get total unread notifications
  const totalUnreadNotifications = Object.values(notifications).reduce(
    (sum, notifs) => sum + notifs.filter((n) => !n.read).length,
    0
  );

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

  // Get current selected child's data
  const selectedChild = childrenAllocations.find((c) => c.childId === selectedChildId);
  const currentTracking = selectedChild ? tracking[selectedChild.childId] : null;
  const currentNotifications = selectedChild ? notifications[selectedChild.childId] || [] : [];
  const unreadCount = currentNotifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bus className="w-8 h-8 text-gray-600" />
            Transport Tracking
          </h1>
          <p className="text-gray-600 mt-1">
            Track your child's school bus in real-time
          </p>
        </div>
        {hasTransport && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={trackingLoading}
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
              {totalUnreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {totalUnreadNotifications}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
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
              None of your children are currently assigned to school transport.
              Please contact the school administration to request transport allocation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Child Selector */}
          {childrenAllocations.length > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Baby className="w-5 h-5 text-gray-600" />
                  <label className="font-medium text-gray-900">Select Child:</label>
                  <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {childrenAllocations.map((child) => (
                        <SelectItem key={child.childId} value={child.childId}>
                          {child.childName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Child's Transport Info */}
          {selectedChild && (
            <>
              {/* Child Name Header */}
              <Card className="border-gray-300 bg-gray-50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Baby className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedChild.childName}</h2>
                      <p className="text-sm text-gray-600">Transport Allocation Details</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transport Overview Card */}
              <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white">
                        <Bus className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Route {selectedChild.allocation.route?.routeNumber}
                        </h2>
                        <p className="text-gray-700">
                          {selectedChild.allocation.route?.routeName || selectedChild.allocation.route?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedChild.allocation.route?.description && (
                    <p className="text-gray-700 mt-4 max-w-2xl">
                      {selectedChild.allocation.route.description}
                    </p>
                  )}

                  <div className="grid md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/80 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Morning Pickup</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        {formatTime(selectedChild.allocation.pickupTime)}
                      </p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Afternoon Drop</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        {formatTime(selectedChild.allocation.dropTime)}
                      </p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Pickup Point</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        {selectedChild.allocation.pickupPoint}
                      </p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Drop Point</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        {selectedChild.allocation.dropPoint}
                      </p>
                    </div>
                  </div>

                  {selectedChild.allocation.fee && (
                    <div className="mt-4 flex items-center gap-4">
                      <div className="bg-white/80 rounded-lg p-3 inline-block">
                        <p className="text-sm text-gray-600">
                          Monthly Fee: <span className="font-bold text-gray-900">Nu. {selectedChild.allocation.fee}</span>
                        </p>
                      </div>
                      {selectedChild.allocation.isPaid !== undefined && (
                        <Badge className={selectedChild.allocation.isPaid ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                          {selectedChild.allocation.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      )}
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
              {currentTracking && (
                <Card className={currentTracking.status === "moving" ? "border-green-200 bg-green-50" : "border-gray-200"}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-blue-600" />
                      Live Bus Tracking
                    </CardTitle>
                    <CardDescription>
                      Real-time location of {selectedChild.childName}'s bus
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getTrackingStatusColor(currentTracking.status)}`}>
                          {currentTracking.status === "moving" ? (
                            <Bus className="w-6 h-6" />
                          ) : currentTracking.status === "stopped" ? (
                            <Clock className="w-6 h-6" />
                          ) : (
                            <CheckCircle className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-semibold text-gray-900">{getTrackingStatusText(currentTracking.status)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Students On Board</p>
                          <p className="font-semibold text-gray-900">{currentTracking.studentsOnBoard}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Update</p>
                          <p className="font-semibold text-gray-900">
                            {currentTracking.lastUpdate
                              ? new Date(currentTracking.lastUpdate).toLocaleTimeString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {currentTracking.message && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">{currentTracking.message}</p>
                      </div>
                    )}

                    {/* Delay Alerts */}
                    {currentNotifications.length > 0 &&
                      currentNotifications.filter((n) => !n.read).length > 0 && (
                        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-orange-800">
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-semibold">
                              Active Delay Alert: {currentNotifications[0].delayMinutes} minutes
                            </p>
                          </div>
                          <p className="text-sm text-orange-700 mt-1">{currentNotifications[0].message}</p>
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
                    {selectedChild.allocation.driver ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium text-gray-900">
                            {selectedChild.allocation.driver.firstName} {selectedChild.allocation.driver.lastName}
                          </p>
                        </div>
                        {selectedChild.allocation.driver.phone && (
                          <div>
                            <p className="text-sm text-gray-600">Contact</p>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-blue-600" />
                              {selectedChild.allocation.driver.phone}
                            </p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (selectedChild.allocation.driver?.phone) {
                              window.location.href = `tel:${selectedChild.allocation.driver.phone}`;
                            }
                          }}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Driver
                        </Button>
                      </div>
                    ) : selectedChild.allocation.vehicle?.driverName ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium text-gray-900">
                            {selectedChild.allocation.vehicle.driverName}
                          </p>
                        </div>
                        {selectedChild.allocation.vehicle.driverPhone && (
                          <div>
                            <p className="text-sm text-gray-600">Contact</p>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-blue-600" />
                              {selectedChild.allocation.vehicle.driverPhone}
                            </p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (selectedChild.allocation.vehicle?.driverPhone) {
                              window.location.href = `tel:${selectedChild.allocation.vehicle.driverPhone}`;
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
                    {selectedChild.allocation.vehicle ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Vehicle Number</p>
                          <p className="font-medium text-gray-900">
                            {selectedChild.allocation.vehicle.registrationNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-medium text-gray-900">
                            {selectedChild.allocation.vehicle.vehicleType}
                          </p>
                        </div>
                        {selectedChild.allocation.vehicle.capacity && (
                          <div>
                            <p className="text-sm text-gray-600">Capacity</p>
                            <p className="font-medium text-gray-900">
                              {selectedChild.allocation.vehicle.capacity} students
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
                    Stops along {selectedChild.allocation.route?.routeName || selectedChild.allocation.route?.name || "the route"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedChild.allocation.route?.stops && selectedChild.allocation.route.stops.length > 0 ? (
                      <div className="space-y-3">
                        {selectedChild.allocation.route.stops.map((stop, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div
                              className={`w-3 h-3 rounded-full flex items-center justify-center text-xs font-bold mt-1 ${
                                stop.name === selectedChild.allocation.pickupPoint
                                  ? "bg-green-500 text-white"
                                  : stop.name === selectedChild.allocation.dropPoint
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
                            {stop.name === selectedChild.allocation.pickupPoint && (
                              <Badge className="bg-green-100 text-green-800">Pickup</Badge>
                            )}
                            {stop.name === selectedChild.allocation.dropPoint && (
                              <Badge className="bg-blue-100 text-blue-800">Drop</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mt-1">
                            {selectedChild.allocation.pickupPoint?.[0] || "A"}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{selectedChild.allocation.pickupPoint}</p>
                            <p className="text-sm text-gray-500">
                              Morning Pickup · {formatTime(selectedChild.allocation.pickupTime)}
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
                              {selectedChild.allocation.dropPoint?.[0] || "B"}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{selectedChild.allocation.dropPoint}</p>
                              <p className="text-sm text-gray-500">
                                Afternoon Drop · {formatTime(selectedChild.allocation.dropTime)}
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
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <AlertCircle className="w-5 h-5" />
                    Important Information for Parents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Ensure your child is at the pickup point 5 minutes before the scheduled time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Inform the driver in advance if your child will not be using transport on a particular day</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Keep your phone accessible for any emergency communication from the driver</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Contact the school immediately if the bus is running significantly late</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Ensure your child has their school ID card with them while traveling</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Notifications Dialog */}
      {showNotifications && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transport Notifications</CardTitle>
                <CardDescription>Updates about delays and route changes</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowNotifications(false)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.keys(notifications).length === 0 ||
              Object.values(notifications).every((arr) => arr.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No notifications</p>
                </div>
              ) : (
                childrenAllocations.map((child) => {
                  const childNotifications = notifications[child.childId] || [];
                  if (childNotifications.length === 0) return null;

                  return (
                    <div key={child.childId}>
                      <h4 className="font-medium text-gray-700 mb-2">{child.childName}</h4>
                      {childNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border mb-2 ${
                            notification.read
                              ? "bg-gray-50 border-gray-200"
                              : "bg-orange-50 border-orange-200"
                          }`}
                          onClick={() => !notification.read && markAsRead(child.childId, notification.id)}
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
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
