/**
 * STUDENT HOSTEL PAGE
 *
 * Students can:
 * - View their hostel allocation (if any)
 * - Request hostel accommodation
 * - View hostel facilities and rules
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Bed,
  Users,
  Calendar,
  MapPin,
  Utensils,
  Coffee,
  Tv,
  Wifi,
  Shield,
  Loader2,
  Info,
  CheckCircle2,
  DoorOpen,
  Refrigerator,
  Wind,
  Flame,
  AlertCircle,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface HostelAllocation {
  id: string;
  hostelId: string;
  roomId: string;
  bedNumber?: string;
  roomType: string;
  feeAmount?: number;
  feePaid?: number;
  checkInDate?: string;
}

interface HostelFacility {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

export default function StudentHostelPage() {
  const [allocation, setAllocation] = useState<HostelAllocation | null>(null);
  const [facilities, setFacilities] = useState<HostelFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasHostel, setHasHostel] = useState(false);

  // Form state
  const [preferredRoomType, setPreferredRoomType] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");

  useEffect(() => {
    const fetchHostelData = async () => {
      try {
        setLoading(true);
        const [allocRes, facilitiesRes] = await Promise.all([
          fetch("/api/hostel?action=my-location"),
          fetch("/api/hostel?action=facilities"),
        ]);

        const allocData = await allocRes.json();
        const facData = await facilitiesRes.json();

        setAllocation(allocData.allocation);
        setHasHostel(allocData.allocation !== null);
        setFacilities(facData.facilities || []);
      } catch (error) {
        console.error("Error fetching hostel data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHostelData();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-allocation",
          preferredRoomType,
          specialRequirements,
          medicalConditions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Hostel allocation request submitted successfully!");
        setShowRequestDialog(false);
        setPreferredRoomType("");
        setSpecialRequirements("");
        setMedicalConditions("");
      } else {
        alert(data.error || "Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const ROOM_TYPES = [
    { value: "single", label: "Single Room", icon: "🛏️", description: "Private room with attached bathroom" },
    { value: "double", label: "Double Sharing", icon: "👥", description: "Share with one roommate" },
    { value: "triple", label: "Triple Sharing", icon: "🛏️", description: "Share with two roommates" },
    { value: "dormitory", label: "Dormitory", icon: "🛏️", description: "Large shared room with 4-8 students" },
    { value: "suite", label: "Suite", icon: "🏠", description: "Room with attached living area" },
  ];

  const FACILITIES = [
    { name: "Wi-Fi", icon: "Wifi", available: true },
    { name: "Hot Water", icon: "Flame", available: true },
    { name: "Study Room", icon: "Utensils", available: true },
    { name: "Common Room", icon: "Users", available: true },
    { name: "TV Lounge", icon: "Tv", available: true },
    { name: "Mess/Cafeteria", icon: "Coffee", available: true },
    { name: "Laundry", icon: "Shield", available: false },
    { name: "Refrigerator", icon: "Refrigerator", available: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Building className="w-8 h-8 text-purple-600" />
          Hostel Accommodation
        </h1>
        <p className="text-gray-600 mt-1">
          View your hostel allocation and access facilities
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </CardContent>
        </Card>
      ) : !hasHostel ? (
        <>
          {/* No Allocation Card */}
          <Card>
            <CardContent className="py-16 text-center">
              <Bed className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Hostel Allocation
              </h3>
              <p className="text-gray-500 mb-6">
                You are not currently allocated to hostel accommodation.
                If you need hostel accommodation, please submit a request.
              </p>
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowRequestDialog(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Request Accommodation
              </Button>
            </CardContent>
          </Card>

          {/* Hostel Rules Card */}
          <Card>
            <CardHeader>
              <CardTitle>Hostel Rules & Regulations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <p>Students must maintain discipline and follow school rules at all times within the hostel premises.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <p>Visitors are not allowed in student rooms without prior permission from the warden.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <p>All students must be in their rooms by 10:00 PM on weekdays and by 11:00 PM on weekends.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <p>Mobile phones are not permitted during study hours and after 10:00 PM.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Allocation Card */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-purple-800">Your Hostel Allocation</CardTitle>
                <Badge className="bg-purple-600 text-white">
                  Allocated
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Room Number</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {allocation?.roomId}
                  </p>
                  <Badge className="mt-1" style={{
                    background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)'
                  }}>
                    {ROOM_TYPES.find(t => t.value === allocation?.roomType)?.label || allocation?.roomType}
                  </Badge>
                  {allocation?.bedNumber && (
                    <>
                      <p className="text-sm text-gray-600 mt-4">Bed Number</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {allocation.bedNumber}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Fee</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {allocation?.feeAmount ? `Nu. ${allocation.feeAmount}` : "N/A"}
                  </p>
                  {allocation?.feePaid && allocation.feeAmount && allocation.feeAmount > allocation.feePaid && (
                    <p className="text-sm text-orange-600">
                      Pending: Nu. {allocation.feeAmount - allocation.feePaid}
                    </p>
                  )}
                </div>
              </div>

              {allocation?.checkInDate && (
                <div className="mt-6 pt-6 border-t border-purple-200">
                  <p className="text-sm text-gray-600">Check-in Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(allocation.checkInDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Facilities Card */}
          <Card>
            <CardHeader>
              <CardTitle>Hostel Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              {facilities.length > 0 ? (
                <div className="grid md:grid-cols-4 gap-4">
                  {facilities.map((facility) => (
                    <div
                      key={facility.id}
                      className={`p-4 rounded-lg border ${
                        facility.available
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          facility.available ? "bg-green-500" : "bg-gray-400"
                        }`}>
                          {React.cloneElement(facility.icon as React.ReactElement<any>, {
                            className: `w-5 h-5 ${facility.available ? "text-white" : "text-gray-500"}`,
                          })}
                        </div>
                        <span
                          className={`font-medium ${
                            facility.available ? "text-green-700" : "text-gray-500"
                          }`}
                        >
                          {facility.name}
                        </span>
                      </div>
                      {!facility.available && (
                        <p className="text-xs text-gray-500 mt-1">
                          (Coming Soon)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No facilities information available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle>Need Assistance?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Room Maintenance</p>
                    <p className="text-sm text-gray-600">
                      Report any issues with your room to the warden immediately.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Emergency Contact</p>
                    <p className="text-sm text-gray-600">
                      For emergencies after 10:00 PM, contact: <span className="font-semibold">911-XXXXX</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">
                      Hostel is located within the school campus. Ask the warden for exact location.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Hostel Accommodation</DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your hostel accommodation request
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest}>
            <div className="space-y-4 py-4">
              {/* Room Type Preference */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Preferred Room Type *</label>
                <Select value={preferredRoomType} onValueChange={setPreferredRoomType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <div>
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-gray-500">{type.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Special Requirements */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Special Requirements</label>
                <Textarea
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Any special requirements or preferences..."
                  rows={2}
                />
              </div>

              {/* Medical Conditions */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Medical Conditions</label>
                <Textarea
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="Any medical conditions the hostel should be aware of..."
                  rows={2}
                />
              </div>

              {/* Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <Info className="w-4 h-4 inline mr-1" />
                  <strong>Note:</strong> Hostel allocation is subject to availability and approval. You will be notified once your request is processed.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
