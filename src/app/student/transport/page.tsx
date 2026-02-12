/**
 * STUDENT TRANSPORT PAGE
 *
 * Students can:
 * - View their transport route allocation
 * - See bus schedule and stops
 * - Track bus location (if available)
 * - View driver details
 */

"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TransportAllocation {
  id: string;
  routeId: string;
  vehicleId?: string;
  pickupPoint: string;
  dropPoint: string;
  pickupTime: string;
  dropTime: string;
  status: string;
  route?: {
    id: string;
    routeNumber: string;
    routeName: string;
    description?: string;
    fee?: number;
  };
  vehicle?: {
    id: string;
    registrationNumber: string;
    make?: string;
    model?: string;
    capacity?: number;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export default function StudentTransportPage() {
  const [allocation, setAllocation] = useState<TransportAllocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTransport, setHasTransport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/transport?action=my-transport");
        const data = await response.json();
        setAllocation(data.allocation);
        setHasTransport(data.hasTransport || false);
      } catch (error) {
        console.error("Error fetching transport data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransport();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bus className="w-8 h-8 text-orange-600" />
          School Transport
        </h1>
        <p className="text-gray-600 mt-1">
          View your bus route, schedule, and tracking information
        </p>
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
                    <p className="text-gray-700">{allocation?.route?.routeName}</p>
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
            </CardContent>
          </Card>

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
                      onClick={() => window.location.href = `tel:${allocation.driver.phone}`}
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
                    {(allocation.vehicle.make || allocation.vehicle.model) && (
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium text-gray-900">
                          {allocation.vehicle.make} {allocation.vehicle.model}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Capacity</p>
                      <p className="font-medium text-gray-900">
                        {allocation.vehicle.capacity} students
                      </p>
                    </div>
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
                Stops along {allocation?.route?.routeName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mt-1">
                    {allocation?.pickupPoint?.[0] || "A"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{allocation?.pickupPoint}</p>
                    <p className="text-sm text-gray-500">Morning Pickup · {formatTime(allocation?.pickupTime || "")}</p>
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
                      <p className="text-sm text-gray-500">Afternoon Drop · {formatTime(allocation?.dropTime || "")}</p>
                    </div>
                  </div>
                </div>
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
                    <span className="font-medium">{allocation.route?.routeName}</span>
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
                    {allocation.vehicle.make && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Make/Model:</span>
                        <span className="font-medium">{allocation.vehicle.make} {allocation.vehicle.model}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{allocation.vehicle.capacity} students</span>
                    </div>
                  </div>
                </div>
              )}

              {allocation.driver && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Driver Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{allocation.driver.firstName} {allocation.driver.lastName}</span>
                    </div>
                    {allocation.driver.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-medium">{allocation.driver.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
