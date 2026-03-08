"use client";

/**
 * SCHOOL ADMIN HOSTEL MANAGEMENT PAGE
 *
 * Features:
 * - Manage hostel buildings
 * - Manage rooms
 * - Allocate beds to students
 * - Track attendance
 * - Manage complaints
 * - View fee payments
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  Bed,
  Users,
  Calendar,
  MapPin,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  DollarSign,
  FileText,
  Home,
  Settings,
  DoorOpen,
  UserCheck,
  Wrench,
  TrendingUp,
  LogOut,
  Edit,
  Trash2,
  Eye,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import HostelRoomCard from "@/components/hostel-room-card";

// ============================================================================
// Types
// ============================================================================

interface HostelBuilding {
  id: string;
  name: string;
  code?: string;
  type: string;
  totalRooms?: number;
  totalCapacity?: number;
  status: string;
  hasWiFi?: boolean;
  hasCommonRoom?: boolean;
  hasStudyRoom?: boolean;
}

interface HostelRoom {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  capacity: number;
  occupiedBeds: number;
  status: string;
  hostelId: string;
  hostel?: HostelBuilding;
  bedDetails?: Array<{
    bedNumber: string;
    occupied: boolean;
    occupantId?: string;
  }>;
}

interface HostelAllocation {
  id: string;
  studentId: string;
  studentName: string;
  hostelId: string;
  roomId: string;
  bedNumber?: string;
  status: string;
  feeAmount?: number;
  feePaid?: number;
  feeOutstanding?: number;
  allocationDate: string;
  room?: HostelRoom;
  hostel?: HostelBuilding;
}

interface HostelComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  complainantName: string;
  createdAt: string;
}

interface HostelStats {
  totalBuildings: number;
  totalRooms: number;
  totalCapacity: number;
  occupied: number;
  available: number;
  pendingFees: number;
}

// ============================================================================
// Component
// ============================================================================

export default function SchoolAdminHostelPage() {
  // Data states
  const [buildings, setBuildings] = useState<HostelBuilding[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [complaints, setComplaints] = useState<HostelComplaint[]>([]);
  const [stats, setStats] = useState<HostelStats>({
    totalBuildings: 0,
    totalRooms: 0,
    totalCapacity: 0,
    occupied: 0,
    available: 0,
    pendingFees: 0,
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [showBuildingDialog, setShowBuildingDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [showComplaintDetail, setShowComplaintDetail] = useState(false);

  // Form states
  const [selectedBuilding, setSelectedBuilding] = useState<HostelBuilding | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HostelRoom | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<HostelComplaint | null>(null);
  const [buildingForm, setBuildingForm] = useState({
    name: "",
    code: "",
    type: "boys",
    totalFloors: "",
    totalRooms: "",
    totalCapacity: "",
    hasWiFi: false,
    hasCommonRoom: false,
    hasStudyRoom: false,
  });
  const [roomForm, setRoomForm] = useState({
    hostelId: "",
    roomNumber: "",
    floor: "",
    roomType: "double",
    capacity: "2",
  });
  const [allocationForm, setAllocationForm] = useState({
    studentId: "",
    hostelId: "",
    roomId: "",
    bedNumber: "",
    feeType: "semester",
    feeAmount: "",
  });

  useEffect(() => {
    fetchHostelData();
  }, []);

  const fetchHostelData = async () => {
    try {
      setLoading(true);
      const [buildRes, roomsRes, allocRes, compRes] = await Promise.all([
        fetch("/api/hostel?action=buildings"),
        fetch("/api/hostel?action=rooms"),
        fetch("/api/hostel/allocations"),
        fetch("/api/hostel?action=complaints"),
      ]);

      const [buildingsData, roomsData, allocationsData, complaintsData] = await Promise.all([
        buildRes.json(),
        roomsRes.json(),
        allocRes.json(),
        compRes.json(),
      ]);

      setBuildings(buildingsData.buildings || []);
      setRooms(roomsData.rooms || []);
      setAllocations(allocationsData.data?.allocations || []);
      setComplaints(complaintsData.complaints || []);

      // Calculate stats
      const totalCapacity = roomsData.rooms?.reduce((sum: number, r: HostelRoom) => sum + (r.capacity || 0), 0) || 0;
      const occupied = roomsData.rooms?.reduce((sum: number, r: HostelRoom) => sum + (r.occupiedBeds || 0), 0) || 0;
      const pendingFees = allocationsData.data?.allocations?.reduce((sum: number, a: HostelAllocation) => sum + (a.feeOutstanding || 0), 0) || 0;

      setStats({
        totalBuildings: buildingsData.buildings?.length || 0,
        totalRooms: roomsData.rooms?.length || 0,
        totalCapacity,
        occupied,
        available: totalCapacity - occupied,
        pendingFees,
      });
    } catch (error) {
      console.error("Error fetching hostel data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBuilding = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-building",
          ...buildingForm,
          totalFloors: parseInt(buildingForm.totalFloors) || 1,
          totalRooms: parseInt(buildingForm.totalRooms) || 0,
          totalCapacity: parseInt(buildingForm.totalCapacity) || 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowBuildingDialog(false);
        setBuildingForm({
          name: "",
          code: "",
          type: "boys",
          totalFloors: "",
          totalRooms: "",
          totalCapacity: "",
          hasWiFi: false,
          hasCommonRoom: false,
          hasStudyRoom: false,
        });
        fetchHostelData();
      }
    } catch (error) {
      console.error("Error creating building:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-room",
          ...roomForm,
          floor: parseInt(roomForm.floor),
          capacity: parseInt(roomForm.capacity),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowRoomDialog(false);
        setRoomForm({
          hostelId: "",
          roomNumber: "",
          floor: "",
          roomType: "double",
          capacity: "2",
        });
        fetchHostelData();
      }
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocateRoom = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "allocate-room",
          ...allocationForm,
          feeAmount: parseInt(allocationForm.feeAmount) || 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowAllocateDialog(false);
        setAllocationForm({
          studentId: "",
          hostelId: "",
          roomId: "",
          bedNumber: "",
          feeType: "semester",
          feeAmount: "",
        });
        fetchHostelData();
      }
    } catch (error) {
      console.error("Error allocating room:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (allocationId: string) => {
    if (!confirm("Are you sure you want to check out this student from the hostel?")) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkout",
          allocationId,
          checkoutReason: "Session end/Request checkout",
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchHostelData();
      }
    } catch (error) {
      console.error("Error checking out:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve-complaint",
          id: complaintId,
          resolutionDetails: "Issue resolved",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowComplaintDetail(false);
        fetchHostelData();
      }
    } catch (error) {
      console.error("Error resolving complaint:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hostel Management</h1>
          <p className="text-gray-600 mt-1">Manage hostel buildings, rooms, and student allocations</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowBuildingDialog(true)}
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Building
          </Button>
          <Button
            onClick={() => setShowRoomDialog(true)}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Room
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Buildings</CardTitle>
            <Building className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBuildings}</div>
            <p className="text-xs text-gray-500 mt-1">Hostel facilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Rooms</CardTitle>
            <DoorOpen className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRooms}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.available} beds available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Occupancy</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupied}/{stats.totalCapacity}</div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((stats.occupied / stats.totalCapacity) * 100)}% occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Fees</CardTitle>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Nu. {stats.pendingFees.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Outstanding payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Allocations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Allocations</CardTitle>
                <CardDescription>Latest hostel room assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allocations.slice(0, 5).map((allocation) => (
                    <div key={allocation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{allocation.studentName}</p>
                        <p className="text-sm text-gray-600">
                          {allocation.hostel?.name} - Room {allocation.room?.roomNumber}
                        </p>
                      </div>
                      <Badge
                        variant={allocation.status === "active" ? "default" : "secondary"}
                      >
                        {allocation.status}
                      </Badge>
                    </div>
                  ))}
                  {allocations.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No allocations yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Open Complaints */}
            <Card>
              <CardHeader>
                <CardTitle>Open Complaints</CardTitle>
                <CardDescription>Pending hostel issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complaints
                    .filter((c) => c.status === "open" || c.status === "in_progress")
                    .slice(0, 5)
                    .map((complaint) => (
                      <div
                        key={complaint.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowComplaintDetail(true);
                        }}
                      >
                        <div>
                          <p className="font-medium">{complaint.title}</p>
                          <p className="text-sm text-gray-600">{complaint.category}</p>
                        </div>
                        <Badge
                          variant={complaint.priority === "high" ? "destructive" : "secondary"}
                        >
                          {complaint.priority}
                        </Badge>
                      </div>
                    ))}
                  {complaints.filter((c) => c.status === "open" || c.status === "in_progress").length === 0 && (
                    <p className="text-center text-gray-500 py-4">No open complaints</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Buildings Tab */}
        <TabsContent value="buildings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <Card key={building.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{building.name}</CardTitle>
                    <Badge variant="outline">{building.code}</Badge>
                  </div>
                  <CardDescription className="capitalize">{building.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DoorOpen className="w-4 h-4 text-gray-500" />
                      <span>{building.totalRooms || 0} rooms</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{building.totalCapacity || 0} capacity</span>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-3">
                      {building.hasWiFi && <Badge variant="secondary">WiFi</Badge>}
                      {building.hasCommonRoom && <Badge variant="secondary">Common Room</Badge>}
                      {building.hasStudyRoom && <Badge variant="secondary">Study Room</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {buildings.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hostel buildings found</p>
                  <Button
                    onClick={() => setShowBuildingDialog(true)}
                    className="mt-4"
                    style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                  >
                    Create First Building
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <HostelRoomCard
                key={room.id}
                room={room}
                hostel={room.hostel}
                onAllocate={() => {
                  setSelectedRoom(room);
                  setAllocationForm({
                    ...allocationForm,
                    hostelId: room.hostelId,
                    roomId: room.id,
                  });
                  setShowAllocateDialog(true);
                }}
              />
            ))}
            {rooms.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No rooms found</p>
                  <Button
                    onClick={() => setShowRoomDialog(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    Create First Room
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Allocations</CardTitle>
              <CardDescription>Manage student hostel allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allocations.map((allocation) => (
                  <div key={allocation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{allocation.studentName}</p>
                      <p className="text-sm text-gray-600">
                        {allocation.hostel?.name} - Room {allocation.room?.roomNumber}
                        {allocation.bedNumber && ` (Bed ${allocation.bedNumber})`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Allocated: {new Date(allocation.allocationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Nu. {allocation.feeAmount?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          Paid: Nu. {allocation.feePaid?.toLocaleString() || 0}
                        </p>
                        {allocation.feeOutstanding && allocation.feeOutstanding > 0 && (
                          <p className="text-xs text-red-600">
                            Pending: Nu. {allocation.feeOutstanding.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={allocation.status === "active" ? "default" : "secondary"}
                      >
                        {allocation.status}
                      </Badge>
                      {allocation.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckout(allocation.id)}
                          disabled={submitting}
                        >
                          <LogOut className="w-4 h-4 mr-1" />
                          Checkout
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {allocations.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No allocations found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hostel Complaints</CardTitle>
              <CardDescription>Manage maintenance and facility issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedComplaint(complaint);
                      setShowComplaintDetail(true);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{complaint.title}</p>
                        <Badge
                          variant={
                            complaint.priority === "emergency"
                              ? "destructive"
                              : complaint.priority === "high"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {complaint.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {complaint.complainantName} • {complaint.category} •{" "}
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        complaint.status === "resolved"
                          ? "default"
                          : complaint.status === "in_progress"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {complaint.status}
                    </Badge>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No complaints found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Building Dialog */}
      <Dialog open={showBuildingDialog} onOpenChange={setShowBuildingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Hostel Building</DialogTitle>
            <DialogDescription>Add a new hostel building to your campus</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Building Name *</Label>
              <Input
                id="name"
                value={buildingForm.name}
                onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                placeholder="e.g., Boys Hostel Block A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={buildingForm.code}
                  onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                  placeholder="e.g., BH-A"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={buildingForm.type}
                  onValueChange={(value) => setBuildingForm({ ...buildingForm, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="floors">Floors</Label>
                <Input
                  id="floors"
                  type="number"
                  value={buildingForm.totalFloors}
                  onChange={(e) => setBuildingForm({ ...buildingForm, totalFloors: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalRooms">Total Rooms</Label>
                <Input
                  id="totalRooms"
                  type="number"
                  value={buildingForm.totalRooms}
                  onChange={(e) => setBuildingForm({ ...buildingForm, totalRooms: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={buildingForm.totalCapacity}
                  onChange={(e) => setBuildingForm({ ...buildingForm, totalCapacity: e.target.value })}
                  placeholder="120"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wifi"
                  checked={buildingForm.hasWiFi}
                  onChange={(e) => setBuildingForm({ ...buildingForm, hasWiFi: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="wifi">WiFi</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="common"
                  checked={buildingForm.hasCommonRoom}
                  onChange={(e) => setBuildingForm({ ...buildingForm, hasCommonRoom: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="common">Common Room</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="study"
                  checked={buildingForm.hasStudyRoom}
                  onChange={(e) => setBuildingForm({ ...buildingForm, hasStudyRoom: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="study">Study Room</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuildingDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBuilding}
              disabled={submitting || !buildingForm.name}
              style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Building
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Room Dialog */}
      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Room</DialogTitle>
            <DialogDescription>Add a new room to a hostel building</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomHostel">Hostel Building *</Label>
              <Select
                value={roomForm.hostelId}
                onValueChange={(value) => setRoomForm({ ...roomForm, hostelId: value })}
              >
                <SelectTrigger id="roomHostel">
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name} ({building.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="roomNumber">Room Number *</Label>
                <Input
                  id="roomNumber"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="floor">Floor *</Label>
                <Input
                  id="floor"
                  type="number"
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="roomType">Room Type *</Label>
                <Select
                  value={roomForm.roomType}
                  onValueChange={(value) => setRoomForm({ ...roomForm, roomType: value })}
                >
                  <SelectTrigger id="roomType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single (1 bed)</SelectItem>
                    <SelectItem value="double">Double (2 beds)</SelectItem>
                    <SelectItem value="triple">Triple (3 beds)</SelectItem>
                    <SelectItem value="dormitory">Dormitory (4+ beds)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  placeholder="2"
                  min="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoomDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoom}
              disabled={submitting || !roomForm.hostelId || !roomForm.roomNumber}
              style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Room Dialog */}
      <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Allocate Room to Student</DialogTitle>
            <DialogDescription>Assign a bed to a student</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student ID *</Label>
              <Input
                id="studentId"
                value={allocationForm.studentId}
                onChange={(e) => setAllocationForm({ ...allocationForm, studentId: e.target.value })}
                placeholder="Enter student ID"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="allocateHostel">Hostel *</Label>
              <Select
                value={allocationForm.hostelId}
                onValueChange={(value) => setAllocationForm({ ...allocationForm, hostelId: value })}
                disabled
              >
                <SelectTrigger id="allocateHostel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bedNumber">Bed Number</Label>
              <Input
                id="bedNumber"
                value={allocationForm.bedNumber}
                onChange={(e) => setAllocationForm({ ...allocationForm, bedNumber: e.target.value })}
                placeholder="e.g., B1, B2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="feeType">Fee Type</Label>
                <Select
                  value={allocationForm.feeType}
                  onValueChange={(value) => setAllocationForm({ ...allocationForm, feeType: value })}
                >
                  <SelectTrigger id="feeType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="semester">Semester</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feeAmount">Fee Amount (Nu.)</Label>
                <Input
                  id="feeAmount"
                  type="number"
                  value={allocationForm.feeAmount}
                  onChange={(e) => setAllocationForm({ ...allocationForm, feeAmount: e.target.value })}
                  placeholder="5000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAllocateRoom}
              disabled={submitting || !allocationForm.studentId}
              style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Allocate Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complaint Detail Dialog */}
      <Dialog open={showComplaintDetail} onOpenChange={setShowComplaintDetail}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedComplaint?.title}</DialogTitle>
            <DialogDescription>Complaint details and resolution</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Category</Label>
                  <p className="font-medium capitalize">{selectedComplaint.category}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Priority</Label>
                  <Badge
                    variant={
                      selectedComplaint.priority === "emergency"
                        ? "destructive"
                        : selectedComplaint.priority === "high"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedComplaint.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Description</Label>
                <p className="text-sm mt-1">{selectedComplaint.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Reported By</Label>
                  <p className="text-sm">{selectedComplaint.complainantName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Date</Label>
                  <p className="text-sm">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Status</Label>
                <Badge variant={selectedComplaint.status === "resolved" ? "default" : "secondary"} className="mt-1">
                  {selectedComplaint.status}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComplaintDetail(false)}>
              Close
            </Button>
            {selectedComplaint?.status !== "resolved" && (
              <Button
                onClick={() => handleResolveComplaint(selectedComplaint.id)}
                disabled={submitting}
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
